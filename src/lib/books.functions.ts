import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import type { BookScope } from "./book-styles";

export const createBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      title?: string;
      style: string;
      customInstruction?: string | null;
      scope: BookScope;
      materialIds?: string[];
      courseId?: string | null;
      subjectId?: string | null;
      topicId?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, parseJson, BASE_SYSTEM } = await import("./ai.server");
    const { styleInstruction } = await import("./books.server");
    const ctx = await buildContext(context.supabase, data);
    if (!ctx.text) throw new Error("Nenhum material processado foi encontrado para essa seleção.");

    const raw = await callAI(
      [
        { role: "system", content: BASE_SYSTEM },
        {
          role: "user",
          content: `Você vai transformar os materiais abaixo em um LIVRO DIDÁTICO personalizado.
Monte primeiro apenas o SUMÁRIO (estrutura), sem escrever o conteúdo dos capítulos.

${styleInstruction(data.style, data.customInstruction)}

Responda SOMENTE com JSON:
{"title":"título do livro","chapters":[{"title":"Introdução","summary":"o que este capítulo cobre"}]}

Regras da estrutura:
- Comece com uma Introdução e termine com Conclusão e Revisão geral.
- A quantidade de capítulos deve refletir o conteúdo real (entre 3 e 12). Não divida artificialmente.
- Cada capítulo cobre um bloco coerente do material.

MATERIAIS:
${ctx.text}`,
        },
      ],
      { temperature: 0.5 },
    );

    const parsed = parseJson<{ title?: string; chapters?: Array<{ title: string; summary?: string }> }>(raw);
    const chapters = (parsed.chapters ?? []).filter((c) => c?.title).slice(0, 14);
    if (chapters.length === 0) throw new Error("A IA não conseguiu montar o livro desse conteúdo.");

    const { data: book, error } = await context.supabase
      .from("books")
      .insert({
        user_id: context.userId,
        title: data.title?.trim() || parsed.title || "Meu livro de estudos",
        style: data.style,
        custom_instruction: data.customInstruction ?? null,
        scope: data.scope,
        course_id: data.courseId ?? null,
        subject_id: data.subjectId ?? null,
        topic_id: data.topicId ?? null,
        material_ids: ctx.sources.map((s) => s.id),
        outline: chapters as unknown as Json,
        sources: ctx.sources as unknown as Json,
        total_chapters: chapters.length,
      })
      .select("id")
      .single();
    if (error || !book) throw new Error("Não foi possível salvar o livro.");

    const insert = await context.supabase.from("book_chapters").insert(
      chapters.map((c, index) => ({
        book_id: book.id,
        user_id: context.userId,
        position: index,
        title: c.title,
        summary: c.summary ?? null,
      })),
    );
    if (insert.error) throw new Error("Não foi possível salvar os capítulos.");

    return { bookId: book.id as string, total: chapters.length };
  });

export const generateChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      bookId: string;
      position: number;
      styleOverride?: string | null;
      instruction?: string | null;
      force?: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, BASE_SYSTEM } = await import("./ai.server");
    const { loadBook, styleInstruction, BOOK_RULES } = await import("./books.server");
    const book = await loadBook(context.supabase, data.bookId);

    const { data: chapter } = await context.supabase
      .from("book_chapters")
      .select("id,title,summary,content")
      .eq("book_id", book.id)
      .eq("position", data.position)
      .maybeSingle();
    if (!chapter) throw new Error("Capítulo não encontrado.");

    if (chapter.content && !data.force) {
      await context.supabase.from("books").update({ current_chapter: data.position }).eq("id", book.id);
      return { content: chapter.content as string, title: chapter.title as string };
    }

    const ctx = await buildContext(context.supabase, {
      scope: book.scope,
      materialIds: book.material_ids,
      courseId: book.course_id,
      subjectId: book.subject_id,
      topicId: book.topic_id,
    });
    if (!ctx.text) throw new Error("Os materiais deste livro não estão mais disponíveis.");

    const style = data.styleOverride ?? book.style;
    const outlineText = (book.outline ?? []).map((c, i) => `${i + 1}. ${c.title}`).join("\n");

    const content = await callAI(
      [
        { role: "system", content: `${BASE_SYSTEM}\n${BOOK_RULES}` },
        {
          role: "user",
          content: `Escreva APENAS o capítulo ${data.position + 1} do livro "${book.title}".

TÍTULO DO CAPÍTULO: ${chapter.title}
O QUE ELE COBRE: ${chapter.summary ?? "—"}

SUMÁRIO COMPLETO (não escreva os outros capítulos):
${outlineText}

COMO EXPLICAR: ${styleInstruction(style, data.instruction ?? book.custom_instruction)}

Estrutura do capítulo:
## ${chapter.title}
Explicação do conteúdo, depois **Exemplos**, **Pontos importantes** e **Resumo do capítulo**.

MATERIAIS DO ALUNO:
${ctx.text}`,
        },
      ],
      { temperature: 0.6 },
    );

    await context.supabase.from("book_chapters").update({ content, style }).eq("id", chapter.id);
    await context.supabase.from("books").update({ current_chapter: data.position }).eq("id", book.id);
    await context.supabase.from("study_sessions").insert({
      user_id: context.userId,
      subject_id: book.subject_id,
      kind: "leitura",
      minutes: 6,
      detail: `${book.title} — ${chapter.title}`,
    });

    return { content, title: chapter.title as string };
  });

export const askAboutBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { bookId: string; position: number; question: string; excerpt?: string | null }) => input,
  )
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, BASE_SYSTEM } = await import("./ai.server");
    const { loadBook, BOOK_RULES } = await import("./books.server");
    const book = await loadBook(context.supabase, data.bookId);

    const { data: chapter } = await context.supabase
      .from("book_chapters")
      .select("title,content")
      .eq("book_id", book.id)
      .eq("position", data.position)
      .maybeSingle();

    const ctx = await buildContext(context.supabase, {
      scope: book.scope,
      materialIds: book.material_ids,
      courseId: book.course_id,
      subjectId: book.subject_id,
      topicId: book.topic_id,
    });

    const content = await callAI(
      [
        { role: "system", content: `${BASE_SYSTEM}\n${BOOK_RULES}` },
        {
          role: "user",
          content: `O aluno está lendo o capítulo "${chapter?.title ?? ""}" do livro "${book.title}".
${data.excerpt ? `\nTRECHO SELECIONADO PELO ALUNO:\n"""${data.excerpt.slice(0, 2000)}"""\n` : ""}
PEDIDO DO ALUNO: ${data.question}

Responda em markdown, de forma objetiva, priorizando o capítulo e os materiais do aluno.

CAPÍTULO ATUAL:
${((chapter?.content as string | null) ?? "(ainda não gerado)").slice(0, 12000)}

MATERIAIS DO ALUNO:
${ctx.text.slice(0, 30000)}`,
        },
      ],
      { temperature: 0.7 },
    );

    return { content };
  });

export const addContentToBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      bookId: string;
      scope: BookScope;
      materialIds?: string[];
      courseId?: string | null;
      subjectId?: string | null;
      topicId?: string | null;
      instruction?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, parseJson, BASE_SYSTEM } = await import("./ai.server");
    const { loadBook, styleInstruction } = await import("./books.server");
    const book = await loadBook(context.supabase, data.bookId);

    const ctx = await buildContext(context.supabase, data);
    if (!ctx.text) throw new Error("Nenhum material processado foi encontrado para essa seleção.");

    const existing = (book.outline ?? []).map((c, i) => `${i + 1}. ${c.title}`).join("\n");
    const raw = await callAI(
      [
        { role: "system", content: BASE_SYSTEM },
        {
          role: "user",
          content: `O livro "${book.title}" já existe com estes capítulos:
${existing}

O aluno enviou NOVOS materiais para incorporar ao mesmo livro.
Crie APENAS os novos capítulos necessários para cobrir o conteúdo novo, sem repetir o que já existe.

${styleInstruction(book.style, data.instruction ?? book.custom_instruction)}

Responda SOMENTE com JSON:
{"chapters":[{"title":"...","summary":"..."}]}

Regras: entre 1 e 8 capítulos novos, coerentes com a sequência do livro.

NOVOS MATERIAIS:
${ctx.text}`,
        },
      ],
      { temperature: 0.5 },
    );

    const parsed = parseJson<{ chapters?: Array<{ title: string; summary?: string }> }>(raw);
    const novos = (parsed.chapters ?? []).filter((c) => c?.title).slice(0, 8);
    if (novos.length === 0) throw new Error("A IA não encontrou conteúdo novo para adicionar.");

    const start = book.total_chapters || (book.outline ?? []).length;
    const insert = await context.supabase.from("book_chapters").insert(
      novos.map((c, i) => ({
        book_id: book.id,
        user_id: context.userId,
        position: start + i,
        title: c.title,
        summary: c.summary ?? null,
      })),
    );
    if (insert.error) throw new Error("Não foi possível salvar os novos capítulos.");

    const mergedIds = Array.from(new Set([...(book.material_ids ?? []), ...ctx.sources.map((s) => s.id)]));
    const outline = [...(book.outline ?? []), ...novos] as unknown as Json;
    await context.supabase
      .from("books")
      .update({
        outline,
        material_ids: mergedIds,
        total_chapters: start + novos.length,
        scope: mergedIds.length > 0 ? "selected" : book.scope,
      })
      .eq("id", book.id);

    return { added: novos.length, total: start + novos.length };
  });
