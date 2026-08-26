import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  BookA,
  Download,
  FileText,
  GitCommitHorizontal,
  Headphones,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Pause,
  Play,
  Presentation,
  Sparkles,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { deleteStudioAsset, generateStudioAsset, listStudioAssets } from "@/lib/studio.functions";
import { STUDIO_ASSETS, studioLabel, type StudioKind } from "@/lib/studio";
import { TEACH_MODES } from "@/lib/teach-modes";
import { PageHeader } from "@/components/study/PageHeader";
import { Markdown } from "@/components/study/Markdown";
import { ScopePicker, emptyScope, validateScope, type StudyScope } from "@/components/study/ScopePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/estudio")({
  head: () => ({
    meta: [
      { title: "Estúdio Catoala — Tutor IA Catoala" },
      {
        name: "description",
        content: "Transforme seus materiais em infográficos, slides, podcasts, glossários e checklists de revisão.",
      },
      { property: "og:title", content: "Estúdio Catoala — crie materiais de estudo" },
      { property: "og:description", content: "Infográficos, slides, podcast narrado e mais, a partir dos seus arquivos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EstudioPage,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Presentation,
  Headphones,
  BookA,
  FileText,
  GitCommitHorizontal,
  Stethoscope,
  ListChecks,
};

function EstudioPage() {
  const generate = useServerFn(generateStudioAsset);
  const list = useServerFn(listStudioAssets);
  const remove = useServerFn(deleteStudioAsset);

  const [kind, setKind] = useState<StudioKind>("infografico");
  const [scope, setScope] = useState<StudyScope>({ ...emptyScope, scope: "selected" });
  const [teachMode, setTeachMode] = useState("professora");
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ title: string; content: string; kind: StudioKind } | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const assets = useQuery({
    queryKey: ["studio-assets"],
    queryFn: () => list(),
  });

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  async function run() {
    const invalid = validateScope(scope);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const output = await generate({
        data: {
          kind,
          scope: scope.scope,
          materialIds: scope.materialIds,
          courseId: scope.courseId,
          subjectId: scope.subjectId,
          topicId: scope.topicId,
          teachMode,
          instruction: instruction.trim() || undefined,
        },
      });
      setResult({ title: output.title, content: output.content, kind });
      void assets.refetch();
      toast.success("Material criado no Estúdio.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não consegui criar este material agora.");
    }
    setBusy(false);
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Seu navegador não suporta narração.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*>_`-]/g, " ").slice(0, 8000));
    utterance.lang = "pt-BR";
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  function download(title: string, content: string) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^\w\s-]/g, "").trim() || "material"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Estúdio Catoala"
        description="Escolha o formato, escolha a linguagem e a Catoala cria um material real a partir dos seus arquivos."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STUDIO_ASSETS.map((asset) => {
          const Icon = ICONS[asset.icon] ?? Sparkles;
          const active = kind === asset.kind;
          return (
            <button
              key={asset.kind}
              onClick={() => setKind(asset.kind)}
              className={cn(
                "surface card-hover p-4 text-left transition-colors duration-200",
                active && "border-primary bg-blush-soft",
              )}
            >
              <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
              <p className="mt-2 text-sm font-semibold">{asset.label}</p>
              <p className="text-xs text-muted-foreground">{asset.describe}</p>
            </button>
          );
        })}
      </section>

      <section className="surface space-y-4 p-5">
        <div>
          <Label className="text-xs">Linguagem da explicação</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TEACH_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setTeachMode(m.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                  teachMode === m.id
                    ? "border-primary bg-blush-soft text-primary"
                    : "border-border hover:border-primary/50",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Pedido extra (opcional)</Label>
          <Input
            className="mt-1.5"
            placeholder="Ex.: foque nos mecanismos de ação e cite exemplos do capítulo 3"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
        </div>

        <ScopePicker value={scope} onChange={setScope} />

        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Criar {studioLabel(kind).toLowerCase()}
        </Button>
      </section>

      {result ? (
        <section className="surface space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">{result.title}</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => speak(result.content)}>
                {speaking ? <Pause className="size-4" /> : <Play className="size-4" />}
                {speaking ? "Parar" : "Ouvir"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => download(result.title, result.content)}>
                <Download className="size-4" /> Baixar
              </Button>
            </div>
          </div>
          <Markdown content={result.content} />
        </section>
      ) : null}

      <section className="surface space-y-3 p-5">
        <h2 className="text-base font-semibold">Meus materiais do Estúdio</h2>
        {assets.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </p>
        ) : (assets.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada criado ainda. Escolha um formato acima para começar.</p>
        ) : (
          <ul className="space-y-2">
            {assets.data?.map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-3">
                <details>
                  <summary className="cursor-pointer text-sm font-medium">{a.title}</summary>
                  <div className="mt-3">
                    <Markdown content={a.content ?? ""} />
                  </div>
                </details>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => speak(a.content ?? "")}>
                    <Headphones className="size-4" /> Ouvir
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => download(a.title, a.content ?? "")}>
                    <Download className="size-4" /> Baixar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await remove({ data: { id: a.id } });
                      void assets.refetch();
                    }}
                  >
                    <Trash2 className="size-4" /> Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
