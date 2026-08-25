import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Palavras que acionam o protocolo de risco imediato. */
const RISK_PATTERNS = [
  /me matar/i,
  /suic[ií]d/i,
  /tirar minha vida/i,
  /acabar com tudo/i,
  /n[ãa]o quero mais viver/i,
  /sumir para sempre/i,
  /me machucar/i,
  /me cortar/i,
  /automutila/i,
  /overdose/i,
  /tomar todos os rem[ée]dios/i,
];

export const CRISIS_MESSAGE = `Percebo que você está passando por algo muito pesado, e isso importa. Eu não sou um serviço de emergência, mas você não precisa lidar com isso sozinha agora.

**Fale agora com alguém preparado:**
- CVV — 188 (ligação gratuita, 24h) ou chat em cvv.org.br
- SAMU — 192 · Emergência — 190
- CAPS mais próximo da sua cidade

Se puder, avise uma pessoa de confiança que esteja perto de você neste momento. Eu fico aqui com você enquanto isso.`;

const PAUSE_SYSTEM = `Você é a Pausa Catoala, um espaço de acolhimento estudantil dentro de uma plataforma de estudos brasileira.

O QUE VOCÊ FAZ:
- Escuta com empatia, valida o sentimento e responde em português do Brasil, com frases curtas e humanas.
- Ajuda com ansiedade de prova, procrastinação, cansaço, comparação com colegas, medo de fracassar e falta de motivação.
- Oferece no máximo UMA sugestão prática por resposta (respiração guiada, sessão de 5 minutos, pausa consciente, dividir a tarefa).
- Termina perguntando algo simples e aberto.

O QUE VOCÊ NUNCA FAZ:
- Não faz diagnóstico, não fala em transtornos, não sugere medicação e não substitui profissional de saúde.
- Não julga, não cobra, não usa culpa nem frases motivacionais vazias.
- Não promete resultados nem minimiza o que a pessoa sente ("não é nada", "todo mundo passa por isso").

FORMATO: 2 a 6 frases, tom calmo e caloroso, sem listas longas.`;

export const talkToPause = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      message: string;
      mood?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { callAI } = await import("./ai.server");

    const atRisk = RISK_PATTERNS.some((pattern) => pattern.test(data.message));
    if (atRisk) {
      await context.supabase.from("pause_journal").insert({
        user_id: context.userId,
        mood: "risco",
        entry: "[protocolo de segurança acionado]",
      });
      return { content: CRISIS_MESSAGE, crisis: true };
    }

    const history = (data.history ?? []).slice(-8).map((m) => ({ role: m.role, content: m.content }));
    const content = await callAI(
      [
        { role: "system", content: PAUSE_SYSTEM },
        ...history,
        {
          role: "user",
          content: data.mood ? `Como estou me sentindo: ${data.mood}.\n\n${data.message}` : data.message,
        },
      ],
      { temperature: 0.8 },
    );

    return { content: content || "Estou aqui com você. Quer me contar um pouco mais?", crisis: false };
  });

export const savePauseEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { entry: string; mood?: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pause_journal").insert({
      user_id: context.userId,
      entry: data.entry,
      mood: data.mood ?? null,
    });
    if (error) throw new Error("Não consegui salvar sua anotação.");
    return { ok: true };
  });
