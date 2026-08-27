import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export type ThemeId = "pink" | "blue" | "light" | "dark" | "system";

export const THEMES: { id: ThemeId; label: string; description: string; swatch: string[] }[] = [
  {
    id: "pink",
    label: "Rosa Catoala",
    description: "Delicado, elegante e acolhedor.",
    swatch: ["#FFF8FC", "#D85B9B", "#A9D7F7", "#273142"],
  },
  {
    id: "blue",
    label: "Azul Catoala",
    description: "Calmo e ideal para concentração.",
    swatch: ["#F5FAFF", "#4B9BD5", "#E891BC", "#253244"],
  },
  {
    id: "light",
    label: "Modo Claro",
    description: "Neutro, clean e sofisticado.",
    swatch: ["#F8FAFC", "#6574C4", "#D85B9B", "#1F2937"],
  },
  {
    id: "dark",
    label: "Modo Noturno",
    description: "Confortável para estudar à noite.",
    swatch: ["#0F172A", "#82BDE8", "#F18AB8", "#F8FAFC"],
  },
  {
    id: "system",
    label: "Automático",
    description: "Acompanha o tema do seu aparelho.",
    swatch: ["#FFF8FC", "#0F172A", "#D85B9B", "#82BDE8"],
  },
];

export type AppearancePrefs = {
  theme: ThemeId;
  mascotEnabled: boolean;
  reducedMotion: boolean;
};

const DEFAULTS: AppearancePrefs = { theme: "pink", mascotEnabled: true, reducedMotion: false };
const STORAGE_KEY = "catoala:appearance";

export function isThemeId(value: unknown): value is ThemeId {
  return value === "pink" || value === "blue" || value === "light" || value === "dark" || value === "system";
}

export function readLocalPrefs(): AppearancePrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AppearancePrefs>;
    return {
      theme: isThemeId(parsed.theme) ? parsed.theme : DEFAULTS.theme,
      mascotEnabled: parsed.mascotEnabled !== false,
      reducedMotion: parsed.reducedMotion === true,
    };
  } catch {
    return DEFAULTS;
  }
}

export function resolveTheme(theme: ThemeId): Exclude<ThemeId, "system"> {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "pink";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyAppearance(prefs: AppearancePrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = resolveTheme(prefs.theme);
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-reduced-motion", prefs.reducedMotion ? "true" : "false");
  root.classList.toggle("dark", resolved === "dark");
}

type ThemeContextValue = AppearancePrefs & {
  resolvedTheme: Exclude<ThemeId, "system">;
  setTheme: (theme: ThemeId) => void;
  setMascotEnabled: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  savePrefs: (next: Partial<AppearancePrefs>) => Promise<void>;
  hasChosenTheme: boolean;
  markThemeChosen: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function persistToProfile(next: AppearancePrefs) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase
    .from("profiles")
    .update({
      theme: next.theme,
      mascot_enabled: next.mascotEnabled,
      reduced_motion: next.reducedMotion,
    } as never)
    .eq("user_id", data.user.id);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AppearancePrefs>(DEFAULTS);
  const [hasChosenTheme, setHasChosenTheme] = useState(true);
  const [systemTick, setSystemTick] = useState(0);

  // Hidrata a partir do armazenamento local (evita piscar) e depois do perfil.
  useEffect(() => {
    const local = readLocalPrefs();
    setPrefs(local);
    applyAppearance(local);
    setHasChosenTheme(window.localStorage.getItem(STORAGE_KEY) !== null);

    let cancelled = false;
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || cancelled) return;
      const { data } = await supabase
        .from("profiles")
        .select("theme, mascot_enabled, reduced_motion")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      const row = data as { theme?: string | null; mascot_enabled?: boolean | null; reduced_motion?: boolean | null };
      const next: AppearancePrefs = {
        theme: isThemeId(row.theme) ? row.theme : local.theme,
        mascotEnabled: row.mascot_enabled !== false,
        reducedMotion: row.reduced_motion === true,
      };
      setPrefs(next);
      applyAppearance(next);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setHasChosenTheme(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") setSystemTick((t) => t + 1);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemTick]);

  // Tema automático segue o aparelho em tempo real.
  useEffect(() => {
    if (prefs.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyAppearance(prefs);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [prefs]);

  const savePrefs = useCallback(
    async (patch: Partial<AppearancePrefs>) => {
      const next = { ...readLocalPrefs(), ...prefs, ...patch };
      setPrefs(next);
      applyAppearance(next);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setHasChosenTheme(true);
      await persistToProfile(next).catch(() => undefined);
    },
    [prefs],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...prefs,
      resolvedTheme: resolveTheme(prefs.theme),
      setTheme: (theme) => void savePrefs({ theme }),
      setMascotEnabled: (mascotEnabled) => void savePrefs({ mascotEnabled }),
      setReducedMotion: (reducedMotion) => void savePrefs({ reducedMotion }),
      savePrefs,
      hasChosenTheme,
      markThemeChosen: () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        setHasChosenTheme(true);
      },
    }),
    [prefs, savePrefs, hasChosenTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      ...DEFAULTS,
      resolvedTheme: "pink",
      setTheme: () => undefined,
      setMascotEnabled: () => undefined,
      setReducedMotion: () => undefined,
      savePrefs: async () => undefined,
      hasChosenTheme: true,
      markThemeChosen: () => undefined,
    };
  }
  return ctx;
}

/** Script inline que aplica o tema antes da primeira pintura (sem flash claro). */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'{}');var t=p.theme||'pink';if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var r=document.documentElement;r.setAttribute('data-theme',t);r.setAttribute('data-reduced-motion',p.reducedMotion?'true':'false');if(t==='dark'){r.classList.add('dark');}}catch(e){}})();`;
