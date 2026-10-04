import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Brain, CheckCircle2, ChevronRight, Coins, Gamepad2, Loader2, Search, ShieldCheck, Sparkles, Swords, Timer, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";

import { analyzeGameMaterial, getGameDashboard, startGameSession, submitGameAnswer } from "@/lib/gamelab.functions";
import { useMaterials } from "@/lib/library";
import { Cato, CatoMessage } from "@/components/brand/Cato";
import { PageHeader } from "@/components/study/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/game-lab")({
  head: () => ({
    meta: [
      { title: "Catoala Game Lab — Tutor IA Catoala" },
      { name: "description", content: "Jogos adaptativos criados com seus próprios materiais de estudo." },
      { property: "og:title", content: "Catoala Game Lab — Tutor IA Catoala" },
      { property: "og:description", content: "Jogos adaptativos criados com seus próprios materiais de estudo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GameLabPage,
});

type Mode = "conteudo" | "investigador" | "360" | "batalha" | "agora";
type Insight = { themes: string[]; subtopics: string[]; concepts: string[]; processes: string[]; key_points: string[] };
type Challenge = {
  id: string;
  position: number;
  phase: string;
  challenge_type: string;
  prompt: string;
  options: string[];
  concept: string;
  source_ref: string;
  source_excerpt: string | null;
  justification_required: boolean;
  difficulty: number;
  metadata: { simpleExplanation?: string; example?: string; analogy?: string; steps?: string[] };
};

const MODES: Array<{ id: Mode; title: string; description: string; icon: typeof Brain; duration: string }> = [
  { id: "conteudo", title: "Desafio do Conteúdo", description: "Compreenda, relacione e aplique os conceitos centrais.", icon: Brain, duration: "8 desafios" },
  { id: "investigador", title: "Investigador", description: "Siga pistas e construa uma conclusão em seis fases.", icon: Search, duration: "6 fases" },
  { id: "360", title: "Desafio 360°", description: "Treine seis habilidades cognitivas com o mesmo material.", icon: ShieldCheck, duration: "6 habilidades" },
  { id: "batalha", title: "Batalha Final", description: "Teste seu domínio completo e receba um relatório final.", icon: Swords, duration: "12 desafios" },
  { id: "agora", title: "Desafio Agora", description: "Uma revisão curta para encaixar na rotina de hoje.", icon: Timer, duration: "3–5 min" },
];

function GameLabPage() {
  const queryClient = useQueryClient();
  const materials = useMaterials({ onlyMine: true });
  const analyze = useServerFn(analyzeGameMaterial);
  const startGame = useServerFn(startGameSession);
  const answerGame = useServerFn(submitGameAnswer);
  const dashboardFn = useServerFn(getGameDashboard);
  const dashboard = useQuery({ queryKey: ["game-lab-dashboard"], queryFn: () => dashboardFn() });

  const [materialId, setMaterialId] = useState<string | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [justification, setJustification] = useState("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string; correctAnswer: string; completed: boolean; score: number; xp: number; coins: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => {
    const stored = sessionStorage.getItem("catoala-game-material");
    if (stored) setMaterialId(stored);
  }, []);

  const readyMaterials = useMemo(() => (materials.data ?? []).filter((m) => m.status === "ready" && m.extracted_text), [materials.data]);
  const selectedMaterial = readyMaterials.find((m) => m.id === materialId);
  const current = challenges[index];
  const gameActive = !!sessionId && !!current;

  async function runAnalysis(id: string) {
    setMaterialId(id);
    sessionStorage.setItem("catoala-game-material", id);
    setInsight(null);
    setBusy("analysis");
    try {
      const result = await analyze({ data: { materialId: id } });
      setInsight(result.insight as unknown as Insight);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível analisar o material.");
    } finally {
      setBusy(null);
    }
  }

  async function start(mode: Mode) {
    if (!materialId) return;
    setBusy(mode);
    try {
      const result = await startGame({ data: { materialId, mode } });
      setSessionId(result.session.id);
      setChallenges(result.challenges as unknown as Challenge[]);
      setIndex(0);
      setAnswer("");
      setFeedback(null);
      setShowHelp(false);
      setStartedAt(Date.now());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o desafio.");
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    if (!current || !sessionId || !answer || feedback) return;
    setBusy("answer");
    try {
      const result = await answerGame({ data: {
        sessionId,
        challengeId: current.id,
        answer,
        justification,
        responseMs: Date.now() - startedAt,
        hintUsed: showHelp,
      } });
      setFeedback({
        isCorrect: result.isCorrect,
        explanation: String(result.feedback.explanation),
        correctAnswer: String(result.feedback.correctAnswer),
        completed: result.completed,
        score: result.score,
        xp: result.xpEarned,
        coins: result.coinsEarned,
      });
      if (result.completed) {
        void dashboard.refetch();
        void queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar a resposta.");
    } finally {
      setBusy(null);
    }
  }

  function next() {
    if (feedback?.completed) {
      setSessionId(null);
      setChallenges([]);
      setFeedback(null);
      setInsight(null);
      return;
    }
    setIndex((value) => value + 1);
    setAnswer("");
    setJustification("");
    setFeedback(null);
    setShowHelp(false);
    setStartedAt(Date.now());
  }

  if (gameActive) {
    const progress = ((index + (feedback ? 1 : 0)) / challenges.length) * 100;
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{current.phase}</p>
            <h1 className="text-xl font-bold">Desafio {index + 1} de {challenges.length}</h1>
          </div>
          <Badge variant="outline">Nível {current.difficulty}</Badge>
        </div>
        <Progress value={progress} aria-label={`Progresso: ${Math.round(progress)}%`} />

        <section className="surface space-y-5 p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <Cato variant={feedback?.isCorrect ? "comemorando" : feedback ? "incentivando" : "concentrado"} size="sm" />
            <div className="min-w-0 flex-1">
              <Badge className="mb-2" variant="secondary">{current.concept}</Badge>
              <h2 className="text-lg font-semibold leading-relaxed">{current.prompt}</h2>
            </div>
          </div>

          <RadioGroup value={answer} onValueChange={setAnswer} disabled={!!feedback} className="gap-3">
            {current.options.map((option) => (
              <label key={option} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors", answer === option ? "border-primary bg-primary/10" : "border-border hover:bg-muted", feedback && "cursor-default")}>
                <RadioGroupItem value={option} className="mt-0.5" />
                <span>{option}</span>
              </label>
            ))}
          </RadioGroup>

          {current.justification_required && !feedback ? (
            <Textarea value={justification} onChange={(event) => setJustification(event.target.value)} placeholder="Explique brevemente como você chegou à resposta..." />
          ) : null}

          {!feedback ? (
            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="ghost" onClick={() => setShowHelp((value) => !value)}>Não entendi</Button>
              <Button onClick={submit} disabled={!answer || busy === "answer"}>
                {busy === "answer" ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />} Confirmar
              </Button>
            </div>
          ) : null}

          {showHelp && !feedback ? (
            <div className="rounded-lg border border-border bg-muted/60 p-4 text-sm">
              <p className="font-semibold">Vamos por partes</p>
              <p className="mt-1 text-muted-foreground">{current.metadata.simpleExplanation}</p>
              <p className="mt-3"><strong>Exemplo:</strong> {current.metadata.example}</p>
              <p className="mt-2"><strong>Analogia:</strong> {current.metadata.analogy}</p>
              {(current.metadata.steps ?? []).length > 0 ? <ol className="mt-2 list-inside list-decimal text-muted-foreground">{current.metadata.steps?.map((step) => <li key={step}>{step}</li>)}</ol> : null}
            </div>
          ) : null}

          {feedback ? (
            <div className={cn("rounded-lg border p-4", feedback.isCorrect ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10")}>
              <h3 className="flex items-center gap-2 font-semibold">
                {feedback.isCorrect ? <CheckCircle2 className="size-5 text-success" /> : <XCircle className="size-5 text-destructive" />}
                {feedback.isCorrect ? "Boa! Você dominou este passo." : "Ainda não — vamos entender juntos."}
              </h3>
              {!feedback.isCorrect ? <p className="mt-2 text-sm"><strong>Resposta correta:</strong> {feedback.correctAnswer}</p> : null}
              <p className="mt-2 text-sm text-muted-foreground">{feedback.explanation}</p>
              <div className="mt-3 rounded-md bg-background/70 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Fonte: {current.source_ref}</p>
                {current.source_excerpt ? <p className="mt-1">“{current.source_excerpt}”</p> : null}
              </div>
              {feedback.completed ? (
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-bold">{feedback.score}%</p><p className="text-xs text-muted-foreground">resultado</p></div>
                  <div><p className="text-lg font-bold">+{feedback.xp}</p><p className="text-xs text-muted-foreground">XP</p></div>
                  <div><p className="text-lg font-bold">+{feedback.coins}</p><p className="text-xs text-muted-foreground">moedas</p></div>
                </div>
              ) : null}
              <Button className="mt-4 w-full sm:w-auto" onClick={next}>{feedback.completed ? "Ver central" : "Próximo desafio"}</Button>
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  const gameProfile = dashboard.data?.profile;
  return (
    <div className="space-y-6">
      <PageHeader title="Catoala Game Lab" description="Desafios criados dinamicamente com o conteúdo que você está estudando." />

      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="surface p-5 sm:p-6">
          <CatoMessage variant="incentivando" size="md" title="Seu material vira experiência" message="Escolha um material pronto. Primeiro eu organizo os conceitos; depois você decide como quer treinar." />
        </div>
        <div className="surface grid grid-cols-3 gap-3 p-5 text-center lg:grid-cols-1 lg:text-left">
          <div className="flex items-center justify-center gap-2 lg:justify-start"><Trophy className="size-4 text-primary" /><span><strong>{gameProfile?.game_xp ?? 0}</strong> XP</span></div>
          <div className="flex items-center justify-center gap-2 lg:justify-start"><Coins className="size-4 text-warning" /><span><strong>{gameProfile?.coins ?? 0}</strong> moedas</span></div>
          <div className="flex items-center justify-center gap-2 lg:justify-start"><Gamepad2 className="size-4 text-secondary-foreground" /><span><strong>{dashboard.data?.sessions.filter((s: any) => s.status === "completed").length ?? 0}</strong> partidas</span></div>
        </div>
      </section>

      <section className="surface space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold">1. Escolha o material</h2>
          <p className="text-sm text-muted-foreground">Somente seus materiais processados aparecem aqui.</p>
        </div>
        {readyMaterials.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            Nenhum material está pronto. <Link to="/adicionar" className="font-medium text-primary">Adicionar material</Link>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {readyMaterials.map((material) => (
              <Button key={material.id} variant={materialId === material.id ? "default" : "outline"} className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => runAnalysis(material.id)} disabled={busy !== null}>
                {busy === "analysis" && materialId === material.id ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <Sparkles className="size-4 shrink-0" />}
                {material.title}
              </Button>
            ))}
          </div>
        )}
      </section>

      {busy === "analysis" ? (
        <section className="surface flex min-h-52 flex-col items-center justify-center p-6 text-center">
          <Cato variant="estudando" size="lg" />
          <h2 className="mt-3 font-semibold">Deixa comigo. Vou entender seu material primeiro.</h2>
          <p className="mt-1 text-sm text-muted-foreground">Estou separando conceitos, processos e relações importantes.</p>
        </section>
      ) : null}

      {insight && selectedMaterial ? (
        <>
          <section className="surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase text-primary">Material analisado</p><h2 className="mt-1 text-lg font-semibold">{selectedMaterial.title}</h2></div>
              <Badge variant="outline">Base privada</Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[["Temas", insight.themes.length], ["Subtópicos", insight.subtopics.length], ["Conceitos", insight.concepts.length], ["Processos", insight.processes.length], ["Pontos-chave", insight.key_points.length]].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-border bg-muted/40 p-3"><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{insight.concepts.slice(0, 8).map((concept) => <Badge key={concept} variant="secondary">{concept}</Badge>)}</div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">2. Escolha o modo</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                return (
                  <div key={mode.id} className="surface flex flex-col p-5">
                    <div className="flex items-start justify-between"><Icon className="size-6 text-primary" /><Badge variant="outline">{mode.duration}</Badge></div>
                    <h3 className="mt-4 font-semibold">{mode.title}</h3>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">{mode.description}</p>
                    <Button className="mt-4" variant={mode.id === "agora" ? "default" : "outline"} onClick={() => start(mode.id)} disabled={busy !== null}>
                      {busy === mode.id ? <Loader2 className="size-4 animate-spin" /> : <Gamepad2 className="size-4" />} Começar
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {(dashboard.data?.review.length ?? 0) > 0 ? (
        <section className="surface p-5 sm:p-6">
          <h2 className="font-semibold">Conceitos para fortalecer</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sem culpa: estes são os melhores pontos para sua próxima revisão.</p>
          <div className="mt-3 flex flex-wrap gap-2">{dashboard.data?.review.map((item: any) => <Badge key={`${item.material_id}-${item.concept}`} variant="outline">{item.concept} · nível {item.level}</Badge>)}</div>
        </section>
      ) : null}
    </div>
  );
}