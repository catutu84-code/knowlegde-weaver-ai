import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TaxonomyKind = "course" | "subject" | "topic";

const LABELS: Record<TaxonomyKind, { one: string; all: string; create: string; table: "courses" | "subjects" | "topics" }> = {
  course: { one: "Curso", all: "Todos os cursos", create: "Criar novo curso", table: "courses" },
  subject: { one: "Matéria", all: "Todas as matérias", create: "Criar nova matéria", table: "subjects" },
  topic: { one: "Assunto", all: "Todos os assuntos", create: "Criar novo assunto", table: "topics" },
};

const CREATE_VALUE = "__create__";
const ALL_VALUE = "__all__";

export function TaxonomySelect({
  kind,
  value,
  options,
  onChange,
  parentId,
  allLabel,
  disabled,
  hideLabel,
}: {
  kind: TaxonomyKind;
  value: string | null;
  options: Array<{ id: string; name: string }>;
  onChange: (id: string | null) => void;
  /** course_id for subjects, subject_id for topics */
  parentId?: string | null;
  allLabel?: string;
  disabled?: boolean;
  hideLabel?: boolean;
}) {
  const meta = LABELS[kind];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const needsParent = kind !== "course";

  async function create() {
    if (!name.trim() || !user) return;
    if (needsParent && !parentId) {
      toast.error(kind === "subject" ? "Escolha um curso primeiro." : "Escolha uma matéria primeiro.");
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = { user_id: user.id, name: name.trim() };
    if (kind === "subject") payload["course_id"] = parentId;
    if (kind === "topic") payload["subject_id"] = parentId;

    const { data, error } = await supabase
      .from(meta.table)
      .insert(payload as never)
      .select("id")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error(error?.message ?? "Não foi possível criar.");
      return;
    }
    toast.success(`${meta.one} criado!`);
    await queryClient.invalidateQueries();
    setName("");
    setOpen(false);
    onChange(data.id as string);
  }

  return (
    <div className="space-y-1.5">
      {hideLabel ? null : <Label className="text-xs">{meta.one}</Label>}
      <Select
        value={value ?? ALL_VALUE}
        onValueChange={(v) => {
          if (v === CREATE_VALUE) {
            setOpen(true);
            return;
          }
          onChange(v === ALL_VALUE ? null : v);
        }}
        disabled={disabled ?? false}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={allLabel ?? meta.all} />
        </SelectTrigger>
        <SelectContent className="max-h-[50vh]">
          <SelectItem value={ALL_VALUE}>{allLabel ?? meta.all}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={CREATE_VALUE} className="text-primary">
            + {meta.create}
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{meta.create}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Nome</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void create();
              }}
              placeholder={
                kind === "course" ? "Ex.: Processos Gerenciais" : kind === "subject" ? "Ex.: Gestão Estratégica" : "Ex.: Vantagem Competitiva"
              }
            />
            {needsParent && !parentId ? (
              <p className="text-xs text-warning">
                {kind === "subject" ? "Selecione um curso antes de criar a matéria." : "Selecione uma matéria antes de criar o assunto."}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={() => void create()} disabled={saving || !name.trim() || (needsParent && !parentId)}>
              <Plus className="size-4" /> Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
