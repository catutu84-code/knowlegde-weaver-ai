import { useMemo } from "react";

import { useCourses, useMaterials, useSubjects, useTopics, STATUS_LABEL } from "@/lib/library";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type StudyScope = {
  scope: "material" | "selected" | "topic" | "subject";
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
  const materials = useMaterials({ subjectId: value.subjectId, topicId: value.topicId });

  const readyMaterials = useMemo(
    () => (materials.data ?? []).filter((m) => m.status === "ready"),
    [materials.data],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Curso</Label>
          <Select
            value={value.courseId ?? "all"}
            onValueChange={(v) =>
              onChange({ ...value, courseId: v === "all" ? null : v, subjectId: null, topicId: null, materialIds: [] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
              {(courses.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Matéria</Label>
          <Select
            value={value.subjectId ?? "all"}
            onValueChange={(v) =>
              onChange({ ...value, subjectId: v === "all" ? null : v, topicId: null, materialIds: [] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as matérias</SelectItem>
              {(subjects.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Assunto</Label>
          <Select
            value={value.topicId ?? "all"}
            onValueChange={(v) => onChange({ ...value, topicId: v === "all" ? null : v, materialIds: [] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os assuntos</SelectItem>
              {(topics.data ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!compact ? (
        <div className="space-y-2">
          <Label className="text-xs">Base da IA</Label>
          <RadioGroup
            value={value.scope}
            onValueChange={(v) => onChange({ ...value, scope: v as StudyScope["scope"] })}
            className="grid gap-2 sm:grid-cols-3"
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
          </RadioGroup>
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
