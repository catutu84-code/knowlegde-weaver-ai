export type StudioKind =
  | "infografico"
  | "slides"
  | "podcast"
  | "glossario"
  | "resumo"
  | "linha-do-tempo"
  | "caso-clinico"
  | "checklist";

export const STUDIO_ASSETS: Array<{
  kind: StudioKind;
  label: string;
  describe: string;
  icon: string;
}> = [
  { kind: "infografico", label: "Infográfico", describe: "Blocos visuais com os pontos-chave e números.", icon: "LayoutDashboard" },
  { kind: "slides", label: "Slides de aula", describe: "Apresentação pronta para revisar ou apresentar.", icon: "Presentation" },
  { kind: "podcast", label: "Podcast", describe: "Roteiro narrado que você ouve na plataforma.", icon: "Headphones" },
  { kind: "glossario", label: "Glossário", describe: "Termos essenciais explicados em uma linha.", icon: "BookA" },
  { kind: "resumo", label: "Resumo de estudo", describe: "Resumo enxuto com o que mais importa.", icon: "FileText" },
  { kind: "linha-do-tempo", label: "Linha do tempo", describe: "Sequência cronológica ou de processo.", icon: "GitCommitHorizontal" },
  { kind: "caso-clinico", label: "Caso prático", describe: "Situação real para aplicar o conteúdo.", icon: "Stethoscope" },
  { kind: "checklist", label: "Checklist de revisão", describe: "Lista de verificação antes da prova.", icon: "ListChecks" },
];

export function studioLabel(kind: string) {
  return STUDIO_ASSETS.find((a) => a.kind === kind)?.label ?? kind;
}
