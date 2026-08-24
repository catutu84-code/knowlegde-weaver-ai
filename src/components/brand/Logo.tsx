import { cn } from "@/lib/utils";

/**
 * Símbolo oficial do Tutor IA Catoala: livro aberto estilizado cujas páginas
 * desenham discretamente a letra "C", com um brilho de conhecimento.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Tutor IA Catoala"
      className={cn("size-9", className)}
    >
      <defs>
        <linearGradient id="catoala-blush" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7C9D9" />
          <stop offset="100%" stopColor="#E996B4" />
        </linearGradient>
        <linearGradient id="catoala-sky" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CBE8FA" />
          <stop offset="100%" stopColor="#82BFE8" />
        </linearGradient>
      </defs>

      <rect x="1" y="1" width="46" height="46" rx="14" fill="#FFFFFF" />
      <rect x="1" y="1" width="46" height="46" rx="14" fill="url(#catoala-sky)" opacity="0.14" />

      {/* Página esquerda — curva que forma o "C" */}
      <path
        d="M24 14.5C20.5 11.6 16.2 10.6 11.8 11.5c-1 .2-1.7 1.1-1.7 2.1v18.8c0 1.3 1.2 2.3 2.5 2 3.6-.8 7.2 0 10 2.1a1.7 1.7 0 0 0 1.4.3V14.5Z"
        fill="url(#catoala-blush)"
      />
      {/* Página direita */}
      <path
        d="M24 14.5c3.5-2.9 7.8-3.9 12.2-3 1 .2 1.7 1.1 1.7 2.1v18.8c0 1.3-1.2 2.3-2.5 2-3.6-.8-7.2 0-10 2.1a1.7 1.7 0 0 1-1.4.3V14.5Z"
        fill="url(#catoala-sky)"
      />
      {/* Lombada */}
      <path d="M24 15v22" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
      {/* Linhas de texto (detalhe tecnológico) */}
      <path
        d="M15 19.5h5M15 24h4M29 19.5h5M29 24h4"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Brilho do conhecimento */}
      <path
        d="M35 8.2l1.1 2.5 2.5 1.1-2.5 1.1L35 15.4l-1.1-2.5-2.5-1.1 2.5-1.1L35 8.2Z"
        fill="#82BFE8"
      />
      <circle cx="30.4" cy="6.6" r="1.2" fill="#E996B4" />
    </svg>
  );
}

export function Logo({
  className,
  showText = true,
  compact = false,
}: {
  className?: string;
  showText?: boolean;
  compact?: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark className={compact ? "size-8 shrink-0" : "size-9 shrink-0"} />
      {showText ? (
        <span className="min-w-0 leading-none">
          <span
            className={cn(
              "block truncate font-display font-bold tracking-tight",
              compact ? "text-base" : "text-lg",
            )}
          >
            Tutor <span className="text-gradient">IA</span> Catoala
          </span>
          {!compact ? (
            <span className="mt-1 block truncate text-[11px] font-medium text-muted-foreground">
              Sua inteligência para aprender melhor
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
