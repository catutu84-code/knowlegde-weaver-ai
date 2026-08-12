import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  BrainCircuit,
  Home,
  Library,
  Target,
  Layers3,
  Network,
  GraduationCap,
  XCircle,
  RefreshCw,
  Bot,
  BarChart3,
  CalendarDays,
  Star,
  Users,
  Settings,
  Menu,
  LogOut,
  Plus,
  Flame,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession, useIsAdmin } from "@/lib/auth";
import { levelFromXp } from "@/lib/library";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/biblioteca", label: "Biblioteca", icon: Library },
  { to: "/quiz", label: "Quiz", icon: Target },
  { to: "/flashcards", label: "Flashcards", icon: Layers3 },
  { to: "/mapas", label: "Mapas Mentais", icon: Network },
  { to: "/simulados", label: "Simulados", icon: GraduationCap },
  { to: "/erros", label: "Caderno de Erros", icon: XCircle },
  { to: "/revisoes", label: "Revisões", icon: RefreshCw },
  { to: "/tutor", label: "Tutor IA", icon: Bot },
  { to: "/desempenho", label: "Meu Desempenho", icon: BarChart3 },
  { to: "/plano", label: "Plano de Estudos", icon: CalendarDays },
  { to: "/favoritos", label: "Favoritos", icon: Star },
  { to: "/comunidade", label: "Comunidade", icon: Users },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <item.icon className={cn("size-4", active && "text-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const level = levelFromXp(profile?.xp ?? 0);

  return (
    <div className="flex h-full flex-col gap-5 p-4">
      <Link to="/inicio" onClick={onNavigate} className="flex items-center gap-2 px-1">
        <BrainCircuit className="size-6 text-primary" />
        <span className="font-display text-lg font-bold">Mentor IA</span>
      </Link>

      <Button asChild size="sm" className="justify-start gap-2">
        <Link to="/adicionar" onClick={onNavigate}>
          <Plus className="size-4" /> Adicionar material
        </Link>
      </Button>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <NavList onNavigate={onNavigate} />
      </div>

      <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Flame className="size-3.5 text-accent" />
          {profile?.streak ?? 0} dias de sequência
        </div>
        <p className="mt-1 text-sm font-medium">
          {level.name} · {profile?.xp ?? 0} XP
        </p>
        {isAdmin ? (
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-primary">
            Administrador
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.display_name ?? "E").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link to="/inicio" className="flex items-center gap-2 lg:hidden">
            <BrainCircuit className="size-5 text-primary" />
            <span className="font-display font-bold">Mentor IA</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" title="Perfil">
              <Link to="/configuracoes">
                <Avatar className="size-8">
                  {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                  <AvatarFallback className="bg-primary/15 text-xs text-primary">{initials}</AvatarFallback>
                </Avatar>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
