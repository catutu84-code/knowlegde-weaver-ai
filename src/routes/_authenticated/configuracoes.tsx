import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut, Save } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";
import { levelFromXp } from "@/lib/library";
import { PageHeader } from "@/components/study/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Mentor IA" },
      { name: "description", content: "Ajuste seu perfil, objetivo de estudo e meta semanal." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("300");
  const [level, setLevel] = useState("faculdade");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setGoal(String(profile.weekly_goal_minutes ?? 300));
      setLevel((profile as { study_level?: string | null }).study_level ?? "faculdade");
    }
  }, [profile]);

  async function save() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name,
        weekly_goal_minutes: Number(goal),
        study_level: level,
      } as never)
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Perfil atualizado!");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const rank = levelFromXp(profile?.xp ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Seu perfil e preferências de estudo." />

      <div className="surface space-y-4 p-5">
        <div className="space-y-1.5">
          <Label className="text-xs">Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">E-mail</Label>
          <Input value={user?.email ?? ""} disabled />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nível de estudo</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="escola">Escola</SelectItem>
                <SelectItem value="vestibular">Vestibular / ENEM</SelectItem>
                <SelectItem value="faculdade">Faculdade</SelectItem>
                <SelectItem value="concurso">Concurso</SelectItem>
                <SelectItem value="profissional">Profissional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Meta semanal (minutos)</Label>
            <Input type="number" min={30} step={30} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="size-4" /> Salvar alterações
        </Button>
      </div>

      <div className="surface p-5">
        <h2 className="text-sm font-semibold">Progresso</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {rank.name} · {profile?.xp ?? 0} XP · {profile?.streak ?? 0} dias de sequência
        </p>
      </div>

      <div className="surface p-5">
        <h2 className="text-sm font-semibold">Conta</h2>
        <Button variant="outline" className="mt-3" onClick={signOut}>
          <LogOut className="size-4" /> Sair da conta
        </Button>
      </div>
    </div>
  );
}
