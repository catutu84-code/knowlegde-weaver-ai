export type StudyContextTarget = {
  materialIds?: string[];
  courseId?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
  title?: string;
};

const KEY = "catoala:study-context";

export function saveStudyContext(value: StudyContextTarget) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(value));
}

export function readStudyContext(): StudyContextTarget | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StudyContextTarget) : null;
  } catch {
    return null;
  }
}