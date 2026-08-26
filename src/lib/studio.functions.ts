import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { StudioKind } from "./studio";

type StudioInput = {
  kind: StudioKind;
  scope: "material" | "selected" | "topic" | "subject" | "course";
  materialIds?: string[] | undefined;
  courseId?: string | null | undefined;
  subjectId?: string | null | undefined;
  topicId?: string | null | undefined;
  teachMode?: string | undefined;
  instruction?: string | undefined;
};

const RECIPES: Record<StudioKind, string> = {
  infografico: `Monte um INFOGRÁFICO textual. Formato obrigatório:
# Título
## Ideia central (1 frase)
## 4 a 6 blocos, cada um com "### Nº — Título curto", 2 frases de explicação e, quando existir no material, um dado/número em negrito.
## Conexões (como os blocos se ligam)`,
  slides: `Monte SLIDES DE AULA. Use exatamente este formato para 8 a 12 slides:
## Slide N — Título
- de 2 a 4 bullets curtos
> Nota da apresentadora: uma frase do que falar neste slide`,
  podcast: `Escreva um ROTEIRO DE PODCAST de 4 a 6 minutos, em texto corrido pronto para ser narrado em voz alta.
Estrutura: abertura calorosa, 3 blocos de conteúdo com transições faladas, recapitulação final e despedida.
Não use marcadores, listas, títulos em markdown, asteriscos ou instruções entre parênteses — apenas fala natural em parágrafos.`,
  glossario: `Monte um GLOSSÁRIO com 12 a 20 termos do material, em ordem alfabética.
Formato: **Termo** — definição em uma ou duas frases, na linguagem escolhida.`,
  resumo: `Monte um RESUMO DE ESTUDO enxuto:
# Título
## O essencial (5 bullets)
## Detalhes que caem em prova
## Pegadinhas e confusões comuns
## Em uma frase`,
  "linha-do-tempo": `Monte uma LINHA DO TEMPO (cronológica ou de processo) com 6 a 12 etapas.
Formato: **Etapa/Data** — o que acontece e por que importa.`,
  "caso-clinico": `Monte um CASO PRÁTICO aplicado ao conteúdo:
## Situação (contexto realista)
## Dados disponíveis
## Perguntas (3, do simples ao complexo)
## Resolução comentada
## O que este caso ensina`,
  checklist: `Monte um CHECKLIST DE REVISÃO com 12 a 18 itens verificáveis, agrupados em 3 seções.
Formato: "- [ ] item" com verbo de ação e o conceito exato do material.`,
};

export const generateStudioAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: StudioInput) => input)
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, BASE_SYSTEM } = await import("./ai.server");
    const { TEACH_MODES } = await import("./teach-modes");
    const { studioLabel } = await import("./studio");

    const ctx = await buildContext(context.supabase, {
      scope: data.scope,
      materialIds: data.materialIds ?? [],
      courseId: data.courseId ?? null,
      subjectId: data.subjectId ?? null,
      topicId: data.topicId ?? null,
    });
    if (!ctx.text.trim()) {
      throw new Error("Selecione materiais já processados para o Estúdio usar como base.");
    }

    const mode = TEACH_MODES.find((m) => m.id === data.teachMode);
    const recipe = RECIPES[data.kind];

    const content = await callAI(
      [
        { role: "system", content: BASE_SYSTEM },
        {
          role: "user",
          content: `${recipe}

LINGUAGEM: ${mode ? `${mode.label} — ${mode.prompt}` : "clara, didática e direta"}
${data.instruction ? `PEDIDO DO ALUNO: ${data.instruction}` : ""}

Ao final, inclua uma seção "## Fontes" listando os títulos dos materiais usados.

MATERIAIS DO ALUNO:
${ctx.text}`,
        },
      ],
      { temperature: 0.6 },
    );

    if (!content.trim()) throw new Error("O Estúdio não conseguiu gerar este material agora. Tente novamente.");

    const title = `${studioLabel(data.kind)} — ${new Date().toLocaleDateString("pt-BR")}`;
    const { data: saved } = await context.supabase
      .from("ai_outputs")
      .insert({
        user_id: context.userId,
        subject_id: data.subjectId ?? null,
        topic_id: data.topicId ?? null,
        kind: `studio:${data.kind}`,
        mode: data.teachMode ?? null,
        title,
        content,
        sources: ctx.sources,
      })
      .select("id")
      .maybeSingle();

    return { id: (saved?.id as string) ?? null, title, content, sources: ctx.sources };
  });

export const listStudioAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ai_outputs")
      .select("id,kind,mode,title,content,sources,created_at")
      .like("kind", "studio:%")
      .order("created_at", { ascending: false })
      .limit(30);
    return data ?? [];
  });

export const deleteStudioAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await context.supabase.from("ai_outputs").delete().eq("id", data.id);
    return { ok: true };
  });
