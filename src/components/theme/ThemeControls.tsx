import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";

import { Cato } from "@/components/brand/Cato";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { THEMES, type ThemeId, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const THEME_ICON: Record<ThemeId, typeof Palette> = {
  pink: Palette,
  blue: Palette,
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeQuickMenu() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Trocar tema" title="Trocar tema">
          {theme === "dark" ? <Moon className="size-4" /> : <Palette className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Aparência</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((item) => {
          const Icon = THEME_ICON[item.id];
          return (
            <DropdownMenuItem key={item.id} onSelect={() => setTheme(item.id)} className="min-h-10">
              <Icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {theme === item.id ? <Check className="size-4 text-primary" aria-label="Tema selecionado" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppearancePanel({ compact = false }: { compact?: boolean }) {
  const { theme, mascotEnabled, reducedMotion, savePrefs } = useTheme();

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {THEMES.map((item) => {
          const selected = theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => void savePrefs({ theme: item.id })}
              aria-pressed={selected}
              className={cn(
                "relative min-h-36 overflow-hidden rounded-xl border bg-card p-3 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/60",
              )}
            >
              <div className="mb-3 h-16 overflow-hidden rounded-lg border border-border bg-background p-2" aria-hidden="true">
                <div className="flex h-full gap-1.5">
                  <div className="w-4 rounded-sm" style={{ backgroundColor: item.swatch[1] }} />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="h-2 w-2/3 rounded-full" style={{ backgroundColor: item.swatch[3] }} />
                    <div className="flex-1 rounded-sm" style={{ backgroundColor: item.swatch[0] }} />
                    <div className="h-2 w-1/2 rounded-full" style={{ backgroundColor: item.swatch[2] }} />
                  </div>
                </div>
              </div>
              <span className="block text-sm font-semibold text-foreground">{item.label}</span>
              {!compact ? <span className="mt-1 block text-xs text-muted-foreground">{item.description}</span> : null}
              {selected ? (
                <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                  <span className="sr-only">Selecionado</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Cato variant={theme === "dark" ? "noturno" : "padrao"} size="sm" />
          <div className="min-w-0 flex-1">
            <Label htmlFor="mascot-enabled" className="text-sm font-semibold">Exibir o Cato durante os estudos</Label>
            <p className="text-xs text-muted-foreground">O mascote aparece apenas em momentos úteis.</p>
          </div>
          <Switch
            id="mascot-enabled"
            checked={mascotEnabled}
            onCheckedChange={(checked) => void savePrefs({ mascotEnabled: checked })}
          />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
            <Sun className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Label htmlFor="reduced-motion" className="text-sm font-semibold">Reduzir animações</Label>
            <p className="text-xs text-muted-foreground">Mantém a interface mais estável e confortável.</p>
          </div>
          <Switch
            id="reduced-motion"
            checked={reducedMotion}
            onCheckedChange={(checked) => void savePrefs({ reducedMotion: checked })}
          />
        </div>
      </div>
    </div>
  );
}