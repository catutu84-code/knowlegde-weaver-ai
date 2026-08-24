import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FolderPlus, Layers, Plus, Search, Trash2, FileText, Star } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { STATUS_LABEL, useCourses, useMaterials, useSubjects, useTopics } from "@/lib/library";
import { PageHeader } from "@/components/study/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca — Tutor IA Catoala" },
      { name: "description", content: "Organize seus materiais por curso, matéria e assunto." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const courses = useCourses();
  const subjects = useSubjects(courseId);
  const topics = useTopics(subjectId);
  const materials = useMaterials({ subjectId, topicId });

  const list = (materials.data ?? []).filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()),
  );

  async function createNode(table: "courses" | "subjects" | "topics", payload: Record<string, unknown>) {
    const { error } = await supabase.from(table).insert({ user_id: user!.id, ...payload } as never);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Criado com sucesso!");
    queryClient.invalidateQueries();
  }

  async function removeMaterial(id: string, path: string | null) {
    if (!confirm("Excluir este material?")) return;
    if (path) await supabase.storage.from("materials").remove([path]);
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Material excluído.");
    queryClient.invalidateQueries({ queryKey: ["materials"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca"
        description="Curso › Matéria › Assunto › Materiais. Tudo o que a IA usa vem daqui."
        action={
          <Button asChild size="sm">
            <Link to="/adicionar">
              <Plus className="size-4" /> Adicionar material
            </Link>
          </Button>
        }
      />

      <div className="surface space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <NewNodeDialog
            label="Novo curso"
            fields={[{ key: "name", label: "Nome do curso" }]}
            onSubmit={async (values) => {
              await createNode("courses", { name: values["name"] });
            }}
          />
          <NewNodeDialog
            label="Nova matéria"
            disabled={!courseId}
            fields={[{ key: "name", label: "Nome da matéria" }]}
            onSubmit={async (values) => {
              await createNode("subjects", { name: values["name"], course_id: courseId });
            }}
          />
          <NewNodeDialog
            label="Novo assunto"
            disabled={!subjectId}
            fields={[{ key: "name", label: "Nome do assunto" }]}
            onSubmit={async (values) => {
              await createNode("topics", { name: values["name"], subject_id: subjectId });
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            value={courseId ?? "all"}
            onValueChange={(v) => {
              setCourseId(v === "all" ? null : v);
              setSubjectId(null);
              setTopicId(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os cursos" />
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

          <Select
            value={subjectId ?? "all"}
            onValueChange={(v) => {
              setSubjectId(v === "all" ? null : v);
              setTopicId(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as matérias" />
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

          <Select value={topicId ?? "all"} onValueChange={(v) => setTopicId(v === "all" ? null : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os assuntos" />
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="surface p-10 text-center">
          <Layers className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum material aqui ainda. Adicione um arquivo, texto ou link para começar.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/adicionar">Adicionar material</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => {
            const status = STATUS_LABEL[m.status] ?? STATUS_LABEL["pending"]!;
            return (
              <div key={m.id} className="surface flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to="/material/$materialId"
                    params={{ materialId: m.id }}
                    className="min-w-0 flex-1 font-medium hover:text-primary"
                  >
                    <FileText className="mr-1.5 inline size-4 text-primary" />
                    {m.title}
                  </Link>
                  {m.user_id === user?.id ? (
                    <button
                      onClick={() => removeMaterial(m.id, m.file_path)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("border-0", status.className)}>{status.label}</Badge>
                  <span className="text-xs text-muted-foreground">{m.source_kind}</span>
                  {m.visibility !== "private" ? (
                    <Badge variant="outline" className="gap-1">
                      <Star className="size-3" /> compartilhado
                    </Badge>
                  ) : null}
                </div>
                {m.status_message ? (
                  <p className="text-xs text-muted-foreground">{m.status_message}</p>
                ) : null}
                <Button asChild size="sm" variant="outline" className="mt-auto">
                  <Link to="/material/$materialId" params={{ materialId: m.id }}>
                    Estudar com IA
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewNodeDialog({
  label,
  fields,
  onSubmit,
  disabled,
}: {
  label: string;
  fields: Array<{ key: string; label: string }>;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled}>
          <FolderPlus className="size-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs">{f.label}</Label>
              <Input
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            onClick={async () => {
              if (!values["name"]?.trim()) return;
              await onSubmit(values);
              setValues({});
              setOpen(false);
            }}
          >
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
