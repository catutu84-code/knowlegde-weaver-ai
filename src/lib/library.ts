import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Course = { id: string; name: string; description: string | null; user_id: string; is_global: boolean };
export type Subject = { id: string; name: string; course_id: string; user_id: string; is_global: boolean };
export type Topic = { id: string; name: string; subject_id: string; user_id: string; is_global: boolean };

export type Material = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  subject_id: string | null;
  topic_id: string | null;
  source_kind: string;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  status: string;
  status_message: string | null;
  extracted_text: string | null;
  tags: string[];
  visibility: string;
  created_at: string;
};

export const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "⬆️ Enviando", className: "bg-muted text-muted-foreground" },
  processing: { label: "⚙️ Processando", className: "bg-warning/15 text-warning" },
  ready: { label: "✅ Pronto para estudar", className: "bg-success/15 text-success" },
  unsupported: { label: "⚠️ Não processado", className: "bg-destructive/15 text-destructive" },
};

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Course[];
    },
  });
}

export function useSubjects(courseId?: string | null) {
  return useQuery({
    queryKey: ["subjects", courseId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("subjects").select("*").order("name");
      if (courseId) q = q.eq("course_id", courseId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Subject[];
    },
  });
}

export function useTopics(subjectId?: string | null) {
  return useQuery({
    queryKey: ["topics", subjectId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("topics").select("*").order("name");
      if (subjectId) q = q.eq("subject_id", subjectId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Topic[];
    },
  });
}

export function useMaterials(filters?: {
  subjectId?: string | null;
  topicId?: string | null;
  onlyMine?: boolean;
  userId?: string | null;
}) {
  return useQuery({
    queryKey: ["materials", filters?.subjectId ?? "all", filters?.topicId ?? "all", filters?.onlyMine ?? false],
    queryFn: async () => {
      let q = supabase.from("materials").select("*").order("created_at", { ascending: false });
      if (filters?.subjectId) q = q.eq("subject_id", filters.subjectId);
      if (filters?.topicId) q = q.eq("topic_id", filters.topicId);
      if (filters?.onlyMine && filters.userId) q = q.eq("user_id", filters.userId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Material[];
    },
  });
}

export async function logStudySession(input: {
  userId: string;
  subjectId?: string | null;
  kind: string;
  minutes: number;
  detail?: string;
}) {
  await supabase.from("study_sessions").insert({
    user_id: input.userId,
    subject_id: input.subjectId ?? null,
    kind: input.kind,
    minutes: input.minutes,
    detail: input.detail ?? null,
  });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,xp,streak,last_study_date")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!profile) return;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let streak = profile.streak ?? 0;
  if (profile.last_study_date === today) {
    // same day, keep streak
  } else if (profile.last_study_date === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  await supabase
    .from("profiles")
    .update({ xp: (profile.xp ?? 0) + Math.max(5, input.minutes), streak, last_study_date: today })
    .eq("id", profile.id);
}

export function levelFromXp(xp: number) {
  if (xp >= 4000) return { name: "Mestre", next: null as number | null, min: 4000 };
  if (xp >= 2000) return { name: "Especialista", next: 4000, min: 2000 };
  if (xp >= 800) return { name: "Dedicado", next: 2000, min: 800 };
  if (xp >= 200) return { name: "Estudante", next: 800, min: 200 };
  return { name: "Iniciante", next: 200, min: 0 };
}
