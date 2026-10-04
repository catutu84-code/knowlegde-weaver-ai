import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";

import { createGatewayRunIdFetch } from "./ai-gateway-run-id.server";

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const insightSchema = z.object({
  themes: z.array(z.string()),
  subtopics: z.array(z.string()),
  concepts: z.array(z.string()),
  processes: z.array(z.string()),
  keyPoints: z.array(z.string()),
});

const challengeSchema = z.object({
  challenges: z.array(z.object({
    phase: z.string(),
    type: z.enum(["multiple_choice", "true_false", "case", "sequence"]),
    prompt: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.string(),
    explanation: z.string(),
    concept: z.string(),
    sourceRef: z.string(),
    sourceExcerpt: z.string(),
    justificationRequired: z.boolean(),
    difficulty: z.number(),
    simpleExplanation: z.string(),
    example: z.string(),
    analogy: z.string(),
    steps: z.array(z.string()),
  })),
});

async function generateObject<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("A IA está indisponível no momento.");
  const runId = createGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runId.fetch,
  });
  const result = streamText({
    model: provider.responses(MODEL),
    output: Output.object({ schema }),
    prompt,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return result.output;
}

export async function analyzeStudyMaterial(title: string, materialText: string) {
  return generateObject(
    `Analise o material de estudo abaixo em português do Brasil. Extraia apenas informações realmente presentes nele. Organize uma lista concisa de temas, subtópicos, conceitos, processos e pontos importantes.\n\nMATERIAL: ${title}\n${materialText}`,
    insightSchema,
  );
}

export async function generateGameChallenges(input: {
  title: string;
  materialText: string;
  mode: string;
  phases: string[];
  difficulty: number;
  avoidPrompts: string[];
}) {
  const amount = input.mode === "agora" ? 5 : input.mode === "batalha" ? 12 : 8;
  return generateObject(
    `Crie ${amount} desafios educacionais adultos e variados para o modo "${input.mode}". Use somente fatos presentes no material. Distribua entre as fases: ${input.phases.join(", ")}. Misture múltipla escolha, verdadeiro/falso, caso aplicado e sequência. Toda atividade deve ter de 2 a 5 opções, com a resposta correta exatamente igual a uma opção. Em sequência, cada opção representa uma ordem completa possível. Em verdadeiro/falso, use exatamente "Verdadeiro" e "Falso". A explicação deve ensinar por que a resposta está correta. sourceRef deve ser o título do material e sourceExcerpt deve ser um trecho curto literal que sustente a resposta. Inclua apoio para "Não entendi": explicação simples, exemplo, analogia e passos. Dificuldade alvo: ${input.difficulty}/5. Evite repetir estas perguntas anteriores: ${input.avoidPrompts.join(" | ") || "nenhuma"}.\n\nMATERIAL: ${input.title}\n${input.materialText}`,
    challengeSchema,
  );
}