import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import type { BookScope } from "./book-styles";

type BookInput = {
  title?: string;
  style: string;
  customInstruction?: string | null;
  scope: BookScope;
  materialIds?: string[];
  courseId?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
};

export const createBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: BookInput) => input)
  .handler(async ({ data, context }) => {
    const { buildContext } = await import("./ai.server");
    const { generateCompleteBook } = await import("./books.server");
    const ctx = await buildContext(context.supabase, data);
    if (!ctx.text) throw new Error("Nenhum material processado foi encontrado para essa seleção. Envie um arquivo na aba Upload ou escolha materiais com status Pronto.");

    const generated = await generateCompleteBook({
      contextText: ctx.text,
      sourceTitles: ctx.sources.map((source) => source.title),
      requestedTitle: data.title,
      style: data.style,
      customInstruction: data.customInstruction,
    });
    const outline = generated.chapters.map((chapter) => ({ title: chapter.title, summary: chapter.summary }));
    const { data: book, error } = await context.supabase
      .from("books")
      .insert({
        user_id: context.userId,
        title: generated.title,
        subtitle: generated.subtitle,
        introduction: generated.introduction,
        style: data.style,
        custom_instruction: data.customInstruction ?? null,
        scope: data.scope,
        course_id: data.courseId ?? null,
        subject_id: data.subjectId ?? null,
        topic_id: data.topicId ?? null,
        material_ids: ctx.sources.map((source) => source.id),
        outline: outline as unknown as Json,
        sources: ctx.sources as unknown as Json,
        total_chapters: generated.chapters.length,
        generation_status: "ready",
        generation_stage: "Livro completo",
        reading_progress: 0,
        current_chapter: 0,
        current_page: 0,
      })
      .select("id")
      .single();
    if (error || !book) throw new Error("Não foi possível salvar o livro completo.");

    const insert = await context.supabase.from("book_chapters").insert(
      generated.chapters.map((chapter, index) => ({
        book_id: book.id,
        user_id: context.userId,
        position: index,
        title: chapter.title,
        summary: chapter.summary,
        content: chapter.content,
        style: data.style,
        source_refs: ctx.sources.filter((source) => chapter.sourceTitles.includes(source.title)) as unknown as Json,
      })),
    );
    if (insert.error) {
      await context.supabase.from("books").delete().eq("id", book.id);
      throw new Error("Não foi possível salvar os capítulos do livro.");
    }

    return { bookId: book.id as string, total: generated.chapters.length };
  });

export const completeExistingBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string }) => input)
  .handler(async ({ data, context }) => {
    const { buildContext } = await import("./ai.server");
    const { generateCompleteBook, loadBook } = await import("./books.server");
    const book = await loadBook(context.supabase, data.bookId);
    await context.supabase.from("books").update({ generation_status: "generating", generation_stage: "Escrevendo o livro", generation_error: null }).eq("id", book.id);
    try {
      const ctx = await buildContext(context.supabase, {
        scope: book.scope,
        materialIds: book.material_ids,
        courseId: book.course_id,
        subjectId: book.subject_id,
        topicId: book.topic_id,
      });
      if (!ctx.text) throw new Error("Os materiais deste livro não estão mais disponíveis.");
      const generated = await generateCompleteBook({
        contextText: ctx.text,
        sourceTitles: ctx.sources.map((source) => source.title),
        requestedTitle: book.title,
        style: book.style,
        customInstruction: book.custom_instruction,
      });
      const outline = generated.chapters.map((chapter) => ({ title: chapter.title, summary: chapter.summary }));
      await context.supabase.from("book_chapters").delete().eq("book_id", book.id);
      const inserted = await context.supabase.from("book_chapters").insert(generated.chapters.map((chapter, index) => ({
        book_id: book.id,
        user_id: context.userId,
        position: index,
        title: chapter.title,
        summary: chapter.summary,
        content: chapter.content,
        style: book.style,
        source_refs: ctx.sources.filter((source) => chapter.sourceTitles.includes(source.title)) as unknown as Json,
      })));
      if (inserted.error) throw new Error("Não foi possível salvar os capítulos recuperados.");
      await context.supabase.from("books").update({
        subtitle: generated.subtitle,
        introduction: generated.introduction,
        outline: outline as unknown as Json,
        sources: ctx.sources as unknown as Json,
        material_ids: ctx.sources.map((source) => source.id),
        total_chapters: generated.chapters.length,
        generation_status: "ready",
        generation_stage: "Livro completo",
        generation_error: null,
        reading_progress: 0,
        current_chapter: 0,
        current_page: 0,
      }).eq("id", book.id);
      return { total: generated.chapters.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível concluir o livro.";
      await context.supabase.from("books").update({ generation_status: "failed", generation_stage: "Falha na geração", generation_error: message }).eq("id", book.id);
      throw error;
    }
  });

export const updateReadingProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string; chapter: number; page: number; progress: number }) => input)
  .handler(async ({ data, context }) => {
    const progress = Math.max(0, Math.min(100, Math.round(data.progress)));
    const { error } = await context.supabase.from("books").update({ current_chapter: Math.max(0, data.chapter), current_page: Math.max(0, data.page), reading_progress: progress }).eq("id", data.bookId).eq("user_id", context.userId);
    if (error) throw new Error("Não foi possível salvar o progresso de leitura.");
    return { ok: true };
  });

export const generateChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string; position: number; styleOverride?: string | null; instruction?: string | null; force?: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, BASE_SYSTEM } = await import("./ai.server");
    const { loadBook, styleInstruction, BOOK_RULES } = await import("./books.server");
    const book = await loadBook(context.supabase, data.bookId);
    const { data: chapter } = await context.supabase.from("book_chapters").select("id,title,summary,content").eq("book_id", book.id).eq("position", data.position).maybeSingle();
    if (!chapter) throw new Error("Capítulo não encontrado.");
    if (chapter.content && !data.force) return { content: chapter.content as string, title: chapter.title as string };
    const ctx = await buildContext(context.supabase, { scope: book.scope, materialIds: book.material_ids, courseId: book.course_id, subjectId: book.subject_id, topicId: book.topic_id });
    if (!ctx.text) throw new Error("Os materiais deste livro não estão mais disponíveis.");
    const style = data.styleOverride ?? book.style;
    const content = await callAI([
      { role: "system", content: `${BASE_SYSTEM}\n${BOOK_RULES}` },
      { role: "user", content: `Reescreva integralmente APENAS o capítulo "${chapter.title}". Objetivo: ${chapter.summary ?? "explicar este tema"}. Estilo: ${styleInstruction(style, data.instruction ?? book.custom_instruction)}\n\nMATERIAIS:\n${ctx.text}` },
    ], { temperature: 0.45 });
    if (content.trim().length < 500) throw new Error("A IA não gerou um capítulo completo.");
    await context.supabase.from("book_chapters").update({ content, style, source_refs: ctx.sources as unknown as Json }).eq("id", chapter.id);
    return { content, title: chapter.title as string };
  });

export const askAboutBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string; position: number; question: string; excerpt?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, BASE_SYSTEM } = await import("./ai.server");
    const { loadBook, BOOK_RULES } = await import("./books.server");
    const book = await loadBook(context.supabase, data.bookId);
    const { data: chapter } = await context.supabase.from("book_chapters").select("title,content").eq("book_id", book.id).eq("position", data.position).maybeSingle();
    const ctx = await buildContext(context.supabase, { scope: book.scope, materialIds: book.material_ids, courseId: book.course_id, subjectId: book.subject_id, topicId: book.topic_id });
    const content = await callAI([
      { role: "system", content: `${BASE_SYSTEM}\n${BOOK_RULES}` },
      { role: "user", content: `Livro: ${book.title}. Capítulo: ${chapter?.title ?? ""}. ${data.excerpt ? `Trecho: """${data.excerpt.slice(0, 2000)}"""` : ""}\nPedido: ${data.question}\n\nCAPÍTULO:\n${((chapter?.content as string | null) ?? "").slice(0, 12000)}\n\nMATERIAIS:\n${ctx.text.slice(0, 30000)}` },
    ], { temperature: 0.6 });
    return { content };
  });

export const addContentToBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string; scope: BookScope; materialIds?: string[]; courseId?: string | null; subjectId?: string | null; topicId?: string | null; instruction?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { buildContext } = await import("./ai.server");
    const { generateCompleteBook, loadBook } = await import("./books.server");
    const book = await loadBook(context.supabase, data.bookId);
    const newContext = await buildContext(context.supabase, data);
    if (!newContext.text) throw new Error("Nenhum material novo processado foi encontrado.");
    const mergedIds = Array.from(new Set([...(book.material_ids ?? []), ...newContext.sources.map((source) => source.id)]));
    const ctx = await buildContext(context.supabase, { scope: "selected", materialIds: mergedIds });
    const generated = await generateCompleteBook({ contextText: ctx.text, sourceTitles: ctx.sources.map((source) => source.title), requestedTitle: book.title, style: book.style, customInstruction: data.instruction ?? book.custom_instruction });
    const { data: oldChapters } = await context.supabase.from("book_chapters").select("position,title,summary,content,style,source_refs,version").eq("book_id", book.id).order("position");
    await context.supabase.from("book_versions").insert({ book_id: book.id, user_id: context.userId, version: book.current_version ?? 1, title: book.title, subtitle: book.subtitle, style: book.style, custom_instruction: book.custom_instruction, material_ids: book.material_ids, outline: book.outline as unknown as Json, sources: [] as unknown as Json, chapters_snapshot: (oldChapters ?? []) as unknown as Json, reason: "Conteúdo adicionado" });
    await context.supabase.from("book_chapters").delete().eq("book_id", book.id);
    const inserted = await context.supabase.from("book_chapters").insert(generated.chapters.map((chapter, index) => ({ book_id: book.id, user_id: context.userId, position: index, title: chapter.title, summary: chapter.summary, content: chapter.content, style: book.style, version: (book.current_version ?? 1) + 1, source_refs: ctx.sources.filter((source) => chapter.sourceTitles.includes(source.title)) as unknown as Json })));
    if (inserted.error) throw new Error("Não foi possível salvar a nova versão do livro.");
    const outline = generated.chapters.map((chapter) => ({ title: chapter.title, summary: chapter.summary }));
    await context.supabase.from("books").update({ subtitle: generated.subtitle, introduction: generated.introduction, material_ids: mergedIds, sources: ctx.sources as unknown as Json, outline: outline as unknown as Json, total_chapters: generated.chapters.length, current_version: (book.current_version ?? 1) + 1, generation_status: "ready", generation_stage: "Livro atualizado" }).eq("id", book.id);
    return { added: newContext.sources.length, total: generated.chapters.length };
  });