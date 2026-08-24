import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_MODEL = "google/gemini-3.6-flash";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MAX_CHARS_PER_MATERIAL = 14000;
const MAX_TOTAL_CHARS = 60000;

export type SourceRef = { id: string; title: string };

export type ContextScope = "material" | "selected" | "topic" | "subject" | "course";

export type ContextInput = {
  scope: ContextScope;
  materialIds?: string[];
  courseId?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
};

export type StudyContext = {
  text: string;
  sources: SourceRef[];
};

export async function buildContext(
  supabase: SupabaseClient,
  input: ContextInput,
): Promise<StudyContext> {
  let query = supabase
    .from("materials")
    .select("id,title,extracted_text,status,file_name")
    .not("extracted_text", "is", null)
    .order("created_at", { ascending: false })
    .limit(40);

  if (input.scope === "material" || input.scope === "selected") {
    const ids = (input.materialIds ?? []).filter(Boolean);
    if (ids.length === 0) return { text: "", sources: [] };
    query = query.in("id", ids);
  } else if (input.scope === "topic" && input.topicId) {
    query = query.eq("topic_id", input.topicId);
  } else if (input.scope === "subject" && input.subjectId) {
    query = query.eq("subject_id", input.subjectId);
  } else if (input.scope === "course" && input.courseId) {
    query = query.eq("course_id", input.courseId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const sources: SourceRef[] = [];
  const parts: string[] = [];
  let total = 0;
  for (const m of data ?? []) {
    const raw = (m.extracted_text ?? "").trim();
    if (!raw) continue;
    const slice = raw.slice(0, MAX_CHARS_PER_MATERIAL);
    if (total + slice.length > MAX_TOTAL_CHARS) break;
    total += slice.length;
    sources.push({ id: m.id as string, title: m.title as string });
    parts.push(`### MATERIAL: ${m.title}\n(arquivo: ${m.file_name ?? "texto"})\n${slice}`);
  }

  return { text: parts.join("\n\n---\n\n"), sources };
}

export const BASE_SYSTEM = `Você é o Tutor IA Catoala, um professor particular brasileiro, didático, direto e motivador.
REGRAS OBRIGATÓRIAS:
- Baseie-se PRINCIPALMENTE no conteúdo dos materiais fornecidos pelo usuário.
- Nunca invente dados, números ou definições que não estejam nos materiais.
- Se a informação não estiver nos materiais, diga claramente: "Não encontrei essa informação nos materiais disponíveis."
- Sempre que possível cite o material de origem pelo título.
- Escreva sempre em português do Brasil.`;

export async function callAI(
  messages: Array<{ role: string; content: unknown }>,
  options?: { model?: string; temperature?: number },
): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("IA indisponível no momento. Tente novamente mais tarde.");

  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model ?? DEFAULT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.6,
      }),
    });
    if (res.ok) break;
    if (res.status !== 429 && res.status < 500) break;
    if (attempt === 2) break;
    const retryAfter = Number(res.headers.get("Retry-After"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 800 * 2 ** attempt + Math.floor(Math.random() * 250);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  if (!res) throw new Error("A IA não respondeu.");
  if (!res.ok) {
    const raw = await res.text();
    let message = raw;
    try {
      const payload = JSON.parse(raw) as { message?: string; error?: { message?: string } };
      message = payload.message ?? payload.error?.message ?? raw;
    } catch {
      // The gateway may return plain text.
    }
    console.error("AI gateway error", res.status, raw);
    if (res.status === 401) throw new Error("A IA não está configurada corretamente.");
    if (res.status === 400) throw new Error(message || "O pedido enviado à IA é inválido.");
    if (res.status === 402 || res.status === 403) throw new Error(message || "A IA está bloqueada neste espaço de trabalho.");
    if (res.status === 429) throw new Error(message || "Muitas solicitações à IA. Aguarde e tente novamente.");
    throw new Error(message || "A IA não conseguiu responder agora. Tente novamente.");
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

export function parseJson<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) text = fence[1].trim();
  const start = text.indexOf("{");
  const startArr = text.indexOf("[");
  const from =
    start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
  if (from > 0) text = text.slice(from);
  const lastObj = text.lastIndexOf("}");
  const lastArr = text.lastIndexOf("]");
  const to = Math.max(lastObj, lastArr);
  if (to !== -1) text = text.slice(0, to + 1);
  return JSON.parse(text) as T;
}
