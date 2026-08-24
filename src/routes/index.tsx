import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  BrainCircuit,
  Upload,
  Sparkles,
  Target,
  Layers,
  LineChart,
  MessageSquare,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tutor IA Catoala — Estude com seus próprios materiais" },
      {
        name: "description",
        content:
          "Envie PDFs, slides, planilhas, fotos e anotações. A IA transforma tudo em resumos, quiz, flashcards, mapas mentais e revisões personalizadas.",
      },
      { property: "og:title", content: "Tutor IA Catoala — Estude com seus próprios materiais" },
      {
        property: "og:description",
        content: "Professor particular, gerador de questões e sistema de revisão em um só lugar.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Upload, title: "Envie qualquer material", text: "PDF, Word, slides, planilhas, HTML, imagens ou texto colado." },
  { icon: Sparkles, title: "Resumos e explicações", text: "Modo fofoca, faculdade, vida real, memorização e prova." },
  { icon: Target, title: "Quiz e simulados", text: "Questões geradas a partir do seu conteúdo, com correção explicada." },
  { icon: Layers, title: "Flashcards e mapas mentais", text: "Memorize com revisão espaçada e mapas visuais." },
  { icon: MessageSquare, title: "Tutor IA", text: "Converse sobre a matéria usando apenas os seus materiais." },
  { icon: LineChart, title: "Desempenho real", text: "Caderno de erros, progresso por matéria e plano de estudos." },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
  }, [navigate]);

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-6 text-primary" />
          <span className="font-display text-xl font-bold">Tutor IA Catoala</span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-14 pt-6 sm:pt-14">
        <div className="gradient-hero surface overflow-hidden p-7 sm:p-14">
          <p className="mb-4 inline-flex rounded-full border border-border bg-background/40 px-3 py-1 text-xs font-medium text-primary">
            Sua inteligência artificial particular de aprendizagem
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            Você envia o material.{" "}
            <span className="text-gradient">A IA transforma em estudo.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Uma plataforma que organiza sua biblioteca, entende os seus conteúdos e cria resumos,
            quiz, flashcards, mapas mentais, simulados e revisões baseadas nos seus próprios erros.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Começar agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Já tenho conta</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="surface p-5">
              <f.icon className="size-5 text-primary" />
              <h2 className="mt-3 text-base font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Tutor IA Catoala — estude do seu jeito.
      </footer>
    </main>
  );
}
