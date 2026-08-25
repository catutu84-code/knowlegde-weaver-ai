import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Rhythm = {
  id: string;
  user_id: string;
  goal: string | null;
  subjects: string[];
  days_per_week: number;
  minutes_per_day: number;
  preferred_times: string[];
  timezone: string;
  notifications_enabled: boolean;
  max_per_day: number;
  quiet_start: string;
  quiet_end: string;
  onboarded: boolean;
};

export const DEFAULT_RHYTHM: Omit<Rhythm, "id" | "user_id"> = {
  goal: "",
  subjects: [],
  days_per_week: 5,
  minutes_per_day: 30,
  preferred_times: [],
  timezone: "America/Sao_Paulo",
  notifications_enabled: false,
  max_per_day: 2,
  quiet_start: "22:00",
  quiet_end: "07:00",
  onboarded: false,
};

export function useRhythm(userId: string | undefined) {
  return useQuery({
    queryKey: ["rhythm", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("study_rhythm").select("*").eq("user_id", userId!).maybeSingle();
      return (data as Rhythm | null) ?? null;
    },
  });
}

export function useExams(userId: string | undefined) {
  return useQuery({
    queryKey: ["exams", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("exams")
        .select("id,title,exam_date,subject_id")
        .eq("user_id", userId!)
        .gte("exam_date", new Date().toISOString().slice(0, 10))
        .order("exam_date", { ascending: true })
        .limit(5);
      return data ?? [];
    },
  });
}

export const ACHIEVEMENTS: Array<{ code: string; label: string; describe: string }> = [
  { code: "primeiro-passo", label: "Primeiro Passo", describe: "Concluiu a primeira sessão de estudo." },
  { code: "ritmo-aceso", label: "Ritmo Aceso", describe: "Estudou 3 dias seguidos." },
  { code: "semana-cheia", label: "Semana Cheia", describe: "Bateu a meta semanal de minutos." },
  { code: "caderno-limpo", label: "Caderno Limpo", describe: "Resolveu 10 erros do caderno." },
  { code: "leitora-de-livro", label: "Leitora de Livro", describe: "Terminou um livro do Modo Livro." },
  { code: "mente-mapeada", label: "Mente Mapeada", describe: "Criou 5 mapas mentais." },
];

/** Classifica o ritmo atual a partir dos minutos da semana e da meta. */
export function rhythmStatus(minutesWeek: number, goalWeek: number) {
  const pct = goalWeek > 0 ? (minutesWeek / goalWeek) * 100 : 0;
  if (pct >= 100) return { label: "Ritmo forte", tone: "text-primary" };
  if (pct >= 60) return { label: "Bom ritmo", tone: "text-primary" };
  if (pct >= 25) return { label: "Ritmo leve", tone: "text-muted-foreground" };
  if (minutesWeek > 0) return { label: "Começando", tone: "text-muted-foreground" };
  return { label: "Sem ritmo esta semana", tone: "text-muted-foreground" };
}

const GREETINGS = [
  "Que bom te ver por aqui.",
  "Vamos com calma e constância hoje.",
  "Um passo hoje já muda a semana.",
  "Seu tempo rende mais com foco curto.",
  "Pequenas sessões constroem grandes resultados.",
  "Hoje pode ser um dia leve e produtivo.",
  "Bora transformar material em conhecimento?",
];

/** Mensagem estável por dia (evita repetição a cada render). */
export function dailyMessage(seed: string) {
  const day = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (const ch of `${seed}${day}`) hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
  return GREETINGS[hash % GREETINGS.length]!;
}
