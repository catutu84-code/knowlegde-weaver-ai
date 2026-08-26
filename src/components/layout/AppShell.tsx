import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession, useIsAdmin } from "@/lib/auth";
import { levelFromXp } from "@/lib/library";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/tutor", label: "Professora Catoala", icon: Bot },
  { to: "/estudio", label: "Estúdio Catoala", icon: Wand2 },
  { to: "/livro", label: "Modo Livro", icon: BookOpen },
  { to: "/mapas", label: "Mapas Mentais", icon: Network },
  { to: "/quiz", label: "Quiz", icon: Target },
  { to: "/flashcards", label: "Flashcards", icon: Layers3 },
  { to: "/simulados", label: "Simulados", icon: GraduationCap },
  { to: "/biblioteca", label: "Biblioteca", icon: Library },
  { to: "/erros", label: "Caderno de Erros", icon: XCircle },
  { to: "/revisoes", label: "Revisões", icon: RefreshCw },
  { to: "/desempenho", label: "Meu Progresso", icon: BarChart3 },
  { to: "/ritmo", label: "Meu Ritmo", icon: Activity },
  { to: "/pausa", label: "Pausa Catoala", icon: Heart },
  { to: "/plano", label: "Plano de Estudos", icon: CalendarDays },
  { to: "/favoritos", label: "Favoritos", icon: Star },
  { to: "/comunidade", label: "Comunidade", icon: Users },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function NavList({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: (() => void) | undefined;
  collapsed?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        const link = (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              collapsed && "justify-center px-0",
              active
                ? "surface-soft text-foreground shadow-none"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground")} />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </Link>
        );
        if (!collapsed) return link;
        return (
          <Tooltip key={item.to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  onSignOut,
}: {
  onNavigate?: (() => void) | undefined;
  collapsed?: boolean;
  onToggleCollapse?: (() => void) | undefined;
  onSignOut?: (() => void) | undefined;
}) {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const level = levelFromXp(profile?.xp ?? 0);
  const initials = (profile?.display_name ?? "E").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col gap-4 p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <Link to="/inicio" onClick={onNavigate} className="min-w-0 flex-1">
          {collapsed ? <LogoMark className="mx-auto size-8" /> : <Logo compact />}
        </Link>
        {onToggleCollapse ? (
          <Button
            variant="ghost"
            size="icon"
            className="hidden shrink-0 lg:inline-flex"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
        ) : null}
      </div>

      <Button
        asChild
        size="sm"
        className={cn("gap-2 rounded-xl", collapsed ? "justify-center px-0" : "justify-start")}
      >
        <Link to="/adicionar" onClick={onNavigate} title="Adicionar material">
          <Plus className="size-4" />
          {!collapsed ? "Adicionar material" : null}
        </Link>
      </Button>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <NavList onNavigate={onNavigate} collapsed={collapsed} />
      </div>

      <div className={cn("surface p-3", collapsed && "px-2")}>
        <Link
          to="/configuracoes"
          onClick={onNavigate}
          className={cn("flex min-w-0 items-center gap-2.5", collapsed && "justify-center")}
        >
          <Avatar className="size-9 shrink-0 ring-1 ring-border">
            {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
            <AvatarFallback className="bg-blush-soft text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {profile?.display_name ?? "Estudante"}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {level.name} · {profile?.xp ?? 0} XP
              </span>
            </span>
          ) : null}
        </Link>

        {!collapsed ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blush-soft px-2.5 py-1 text-[11px] font-medium text-foreground">
              <Flame className="size-3.5 text-primary" />
              {profile?.streak ?? 0} dias
            </span>
            {onSignOut ? (
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onSignOut}>
                <LogOut className="size-3.5" /> Sair
              </Button>
            ) : null}
          </div>
        ) : null}

        {isAdmin && !collapsed ? (
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-accent">Administradora</p>
        ) : null}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("catoala:sidebar") === "collapsed");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("catoala:sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.display_name ?? "E").slice(0, 2).toUpperCase();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur transition-[width] duration-200 lg:block",
            collapsed ? "w-[84px]" : "w-[268px]",
          )}
        >
          <SidebarContent collapsed={collapsed} onToggleCollapse={toggleCollapsed} onSignOut={signOut} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur sm:px-5">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[288px] bg-sidebar p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SidebarContent onNavigate={() => setOpen(false)} onSignOut={signOut} />
              </SheetContent>
            </Sheet>

            <Link to="/inicio" className="min-w-0 lg:hidden">
              <Logo compact />
            </Link>
            <span className="hidden lg:block" />

            <div className="col-start-3 flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" aria-label="Perfil">
                    <Link to="/configuracoes">
                      <Avatar className="size-8">
                        {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                        <AvatarFallback className="bg-blush-soft text-xs font-semibold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Perfil e configurações</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
                    <LogOut className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sair da conta</TooltipContent>
              </Tooltip>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
