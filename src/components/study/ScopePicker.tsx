import { useMemo } from "react";

import { useCourses, useMaterials, useSubjects, useTopics, STATUS_LABEL } from "@/lib/library";
import { TaxonomySelect } from "@/components/study/TaxonomySelect";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type StudyScope = {
  scope: "material" | "selected" | "topic" | "subject" | "course";
  courseId: string | null;
  subjectId: string | null;
  topicId: string | null;
  materialIds: string[];
};

export const emptyScope: StudyScope = {
  scope: "subject",
  courseId: null,
  subjectId: null,
  topicId: null,
  materialIds: [],
};

export function scopeLabel(
  value: StudyScope,
  names: { course?: string | undefined; subject?: string | undefined; topic?: string | undefined },
) {
  switch (value.scope) {
    case "course":
      return `Todo o curso${names.course ? `: ${names.course}` : ""}`;
    case "subject":
      return `Toda a matéria${names.subject ? `: ${names.subject}` : ""}`;
    case "topic":
      return `Todo o assunto${names.topic ? `: ${names.topic}` : ""}`;
    default:
      return `${value.materialIds.length} material(is) selecionado(s)`;
  }
}

export function ScopePicker({
  value,
  onChange,
  compact,
}: {
  value: StudyScope;
  onChange: (next: StudyScope) => void;
  compact?: boolean;
}) {
  const courses = useCourses();
  const subjects = useSubjects(value.courseId);
  const topics = useTopics(value.subjectId);
  const materials = useMaterials({
    courseId: value.courseId,
    subjectId: value.subjectId,
    topicId: value.topicId,
  });

  const readyMaterials = useMemo(
    () => (materials.data ?? []).filter((m) => m.status === "ready"),
    [materials.data],
  );

  const names = {
    course: (courses.data ?? []).find((c) => c.id === value.courseId)?.name,
    subject: (subjects.data ?? []).find((s) => s.id === value.subjectId)?.name,
    topic: (topics.data ?? []).find((t) => t.id === value.topicId)?.name,
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <TaxonomySelect
          kind="course"
          value={value.courseId}
          options={courses.data ?? []}
          onChange={(id) => onChange({ ...value, courseId: id, subjectId: null, topicId: null, materialIds: [] })}
        />
        <TaxonomySelect
          kind="subject"
          value={value.subjectId}
          options={subjects.data ?? []}
          parentId={value.courseId}
          onChange={(id) => onChange({ ...value, subjectId: id, topicId: null, materialIds: [] })}
        />
        <TaxonomySelect
          kind="topic"
          value={value.topicId}
          options={topics.data ?? []}
          parentId={value.subjectId}
          onChange={(id) => onChange({ ...value, topicId: id, materialIds: [] })}
        />
      </div>

      {!compact ? (
        <div className="space-y-2">
          <Label className="text-xs">Base da IA</Label>
          <RadioGroup
            value={value.scope}
            onValueChange={(v) => onChange({ ...value, scope: v as StudyScope["scope"] })}
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
          >
            <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
              <RadioGroupItem value="selected" /> Materiais selecionados
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
              <RadioGroupItem value="topic" disabled={!value.topicId} /> Todo o assunto
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
              <RadioGroupItem value="subject" disabled={!value.subjectId} /> Toda a matéria
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
              <RadioGroupItem value="course" disabled={!value.courseId} /> Todo o curso
            </label>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            A IA vai usar: <span className="text-foreground">{scopeLabel(value, names)}</span>
          </p>
        </div>
      ) : null}

      {value.scope === "selected" || value.scope === "material" ? (
        <div className="space-y-2">
          <Label className="text-xs">Materiais ({value.materialIds.length} selecionados)</Label>
          <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
            {readyMaterials.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                Nenhum material pronto nesta seleção. Adicione materiais na Biblioteca.
              </p>
            ) : (
              readyMaterials.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={value.materialIds.includes(m.id)}
                    onCheckedChange={(checked) =>
                      onChange({
                        ...value,
                        materialIds: checked
                          ? [...value.materialIds, m.id]
                          : value.materialIds.filter((id) => id !== m.id),
                      })
                    }
                  />
                  <span className="min-w-0 flex-1 truncate">{m.title}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {STATUS_LABEL[m.status]?.label ?? m.status}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
