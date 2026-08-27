import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

export type CatoVariant =
  | "padrao"
  | "estudando"
  | "comemorando"
  | "incentivando"
  | "concentrado"
  | "acolhedor"
  | "noturno";

const ALT: Record<CatoVariant, string> = {
  padrao: "Cato, o coala mascote do Tutor IA Catoala, acenando",
  estudando: "Cato estudando com um livro aberto",
  comemorando: "Cato comemorando uma conquista",
  incentivando: "Cato incentivando você a voltar aos estudos",
  concentrado: "Cato concentrado, com fones de ouvido",
  acolhedor: "Cato acolhedor, com um coração",
  noturno: "Cato no modo noturno, com uma lua e estrelas",
};

const SIZES = {
  xs: "size-10",
  sm: "size-16",
  md: "size-24",
  lg: "size-32",
  xl: "size-44",
} as const;

/**
 * Cato — mascote original do Tutor IA Catoala.
 * Coala minimalista, com detalhes acadêmicos discretos (óculos, livro, fones).
 * As cores vêm dos tokens do tema ativo.
 */
export function Cato({
  variant = "padrao",
  size = "md",
  className,
  animate = true,
}: {
  variant?: CatoVariant;
  size?: keyof typeof SIZES;
  className?: string;
  animate?: boolean;
}) {
  const { mascotEnabled, reducedMotion } = useTheme();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    setPaused(document.hidden);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (!mascotEnabled) return null;

  const animated = animate && !reducedMotion;
  const eyesClosed = variant === "concentrado" || variant === "noturno";

  return (
    <svg
      viewBox="0 0 100 112"
      role="img"
      aria-label={ALT[variant]}
      data-variant={variant}
      className={cn(
        SIZES[size],
        "shrink-0 select-none",
        animated && "cato-anim",
        (paused || !animated) && "cato-paused",
        className,
      )}
    >
      <g data-cato="body">
        {/* Orelhas */}
        <g fill="var(--cato-fur)">
          <circle cx="19" cy="30" r="15" />
          <circle cx="81" cy="30" r="15" />
        </g>
        <circle cx="19" cy="30" r="9" fill="var(--cato-blush)" opacity="0.65" />
        <circle cx="81" cy="30" r="9" fill="var(--cato-blush)" opacity="0.65" />

        {/* Corpo */}
        <path
          d="M27 74c0-9 10-14 23-14s23 5 23 14v18c0 8-10 13-23 13S27 100 27 92V74Z"
          fill="var(--cato-fur-dark)"
        />
        <ellipse cx="50" cy="88" rx="14" ry="15" fill="var(--cato-belly)" opacity="0.85" />

        {/* Cabeça */}
        <ellipse cx="50" cy="42" rx="29" ry="27" fill="var(--cato-fur)" />

        {/* Focinho */}
        <ellipse cx="50" cy="54" rx="9.5" ry="8" fill="var(--cato-belly)" opacity="0.9" />
        <ellipse cx="50" cy="51" rx="6.4" ry="5.2" fill="var(--cato-nose)" />
        <ellipse cx="47.6" cy="49.4" rx="1.7" ry="1.2" fill="var(--cato-belly)" opacity="0.5" />

        {/* Bochechas */}
        <ellipse cx="30" cy="49" rx="5.5" ry="3.6" fill="var(--cato-blush)" opacity="0.6" />
        <ellipse cx="70" cy="49" rx="5.5" ry="3.6" fill="var(--cato-blush)" opacity="0.6" />

        {/* Olhos */}
        <g data-cato="eyes">
          {eyesClosed ? (
            <>
              <path d="M34 42q4 4 8 0" stroke="var(--cato-nose)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              <path d="M58 42q4 4 8 0" stroke="var(--cato-nose)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="38" cy="41" r="4.2" fill="var(--cato-nose)" />
              <circle cx="62" cy="41" r="4.2" fill="var(--cato-nose)" />
              <circle cx="39.4" cy="39.6" r="1.4" fill="var(--cato-belly)" />
              <circle cx="63.4" cy="39.6" r="1.4" fill="var(--cato-belly)" />
            </>
          )}
        </g>

        {/* Óculos discretos */}
        <g fill="none" stroke="var(--cato-accent)" strokeWidth="1.8" opacity="0.9">
          <circle cx="38" cy="41" r="8" />
          <circle cx="62" cy="41" r="8" />
          <path d="M46 41h8" />
        </g>

        {/* Sorriso */}
        {variant === "comemorando" ? (
          <path d="M44 58q6 6 12 0" stroke="var(--cato-nose)" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M45 57.5q5 3.5 10 0" stroke="var(--cato-nose)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}

        {/* Braço que acena */}
        {variant !== "estudando" && variant !== "concentrado" ? (
          <g data-cato="arm">
            <rect x="21" y="60" width="10" height="22" rx="5" fill="var(--cato-fur-dark)" />
          </g>
        ) : null}

        {/* Acessórios por variação */}
        {variant === "estudando" ? (
          <g>
            <path d="M26 82h48v16H26z" fill="var(--cato-accent)" opacity="0.16" />
            <path
              d="M50 84c-6-4-13-4-20-2v16c7-2 14-2 20 2 6-4 13-4 20-2V82c-7-2-14-2-20 2Z"
              fill="var(--cato-belly)"
              stroke="var(--cato-accent)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M50 84v16" stroke="var(--cato-accent)" strokeWidth="1.6" />
          </g>
        ) : null}

        {variant === "concentrado" ? (
          <g fill="none" stroke="var(--cato-accent)" strokeWidth="4" strokeLinecap="round">
            <path d="M20 36a30 30 0 0 1 60 0" />
            <path d="M18 42v8" />
            <path d="M82 42v8" />
          </g>
        ) : null}

        {variant === "comemorando" ? (
          <g fill="var(--cato-accent-2)">
            <circle cx="14" cy="60" r="2.6" />
            <circle cx="86" cy="58" r="2.2" />
            <circle cx="24" cy="14" r="2.2" />
            <circle cx="78" cy="12" r="2.6" />
          </g>
        ) : null}

        {variant === "acolhedor" ? (
          <path
            d="M76 74c2.6-3 7-2.6 8.6.6 1.5 3-.6 6.4-4.3 9.4l-4.3 3.4-4.3-3.4c-3.7-3-5.8-6.4-4.3-9.4 1.6-3.2 6-3.6 8.6-.6Z"
            fill="var(--cato-blush)"
          />
        ) : null}

        {variant === "noturno" ? (
          <g fill="var(--cato-accent)">
            <path d="M84 14a8 8 0 1 0 7.6 10.4A9.4 9.4 0 0 1 84 14Z" />
            <circle cx="14" cy="18" r="1.8" />
            <circle cx="24" cy="8" r="1.4" />
          </g>
        ) : null}

        {variant === "incentivando" ? (
          <g>
            <rect x="66" y="66" width="22" height="15" rx="7" fill="var(--cato-accent)" opacity="0.18" />
            <circle cx="72" cy="73.5" r="1.7" fill="var(--cato-accent)" />
            <circle cx="77" cy="73.5" r="1.7" fill="var(--cato-accent)" />
            <circle cx="82" cy="73.5" r="1.7" fill="var(--cato-accent)" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}

/** Balão de fala do Cato: mascote + mensagem, acessível e responsivo. */
export function CatoMessage({
  variant = "padrao",
  title,
  message,
  size = "sm",
  className,
  children,
}: {
  variant?: CatoVariant;
  title?: string;
  message: string;
  size?: keyof typeof SIZES;
  className?: string;
  children?: React.ReactNode;
}) {
  const { mascotEnabled } = useTheme();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {mascotEnabled ? <Cato variant={variant} size={size} /> : null}
      <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card/80 px-3.5 py-2.5 shadow-none">
        {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : null}
        <p className="text-sm text-muted-foreground">{message}</p>
        {children ? <div className="mt-2.5 flex flex-wrap gap-2">{children}</div> : null}
      </div>
    </div>
  );
}

/** Mensagens oficiais do Cato, reutilizáveis em toda a plataforma. */
export const CATO_LINES = {
  boasVindas: "Oi! Eu sou o Cato. Vamos aprender juntos?",
  maisDezMinutos: "Só mais 10 minutinhos? Eu estudo com você.",
  metaConcluida: "Você concluiu sua meta de hoje. Estou orgulhoso de você!",
  materiaDificil: "Essa matéria parece difícil, mas podemos dividir em partes.",
  retorno: "Você voltou! Vamos retomar de onde paramos?",
  diaDificil: "Hoje foi difícil, mas você apareceu. Isso já importa.",
  explicacao: "Preparei uma explicação do seu jeito.",
  sequencia: "Sua sequência está crescendo. Continue assim!",
  vazio: "Ainda não há nada por aqui. Que tal enviar seu primeiro material?",
  carregando: "Estou lendo seus materiais e preparando tudo com carinho...",
} as const;
