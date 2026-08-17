import { jsPDF } from "jspdf";

export type PdfChapter = { title: string; content: string | null };

function clean(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^>\s?/, "")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1");
}

export function buildBookPdf(book: {
  title: string;
  styleLabel: string;
  chapters: PdfChapter[];
}): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  const maxW = W - M * 2;
  const bottom = H - 60;
  let y = M;
  let pageNo = 1;
  const toc: Array<{ title: string; page: number }> = [];

  function footer() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.text(String(pageNo), W / 2, H - 32, { align: "center" });
    doc.setTextColor(20);
  }

  function newPage() {
    footer();
    doc.addPage();
    pageNo += 1;
    y = M;
  }

  function need(h: number) {
    if (y + h > bottom) newPage();
  }

  function write(text: string, size: number, style: "normal" | "bold" | "italic", gapAfter: number, indent = 0) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxW - indent) as string[];
    for (const line of lines) {
      need(size + 6);
      doc.text(line, M + indent, y);
      y += size + 6;
    }
    y += gapAfter;
  }

  // ---- Cover ----
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, H, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  const titleLines = doc.splitTextToSize(book.title, maxW) as string[];
  let ty = H / 2 - titleLines.length * 18;
  for (const line of titleLines) {
    doc.text(line, W / 2, ty, { align: "center" });
    ty += 36;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(`Estilo de explicação: ${book.styleLabel}`, W / 2, ty + 18, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(190);
  doc.text("Livro digital gerado pelo Mentor IA", W / 2, H - 70, { align: "center" });
  doc.text(new Date().toLocaleDateString("pt-BR"), W / 2, H - 52, { align: "center" });
  doc.setTextColor(20);

  // ---- Placeholder for summary page (filled at the end) ----
  doc.addPage();
  const tocPageIndex = doc.getNumberOfPages();
  pageNo = 1;
  y = M;

  // ---- Chapters ----
  doc.addPage();
  pageNo = 1;
  y = M;
  book.chapters.forEach((chapter, index) => {
    if (index > 0) newPage();
    toc.push({ title: `${index + 1}. ${chapter.title}`, page: pageNo });
    write(`Capítulo ${index + 1}`, 11, "italic", 4);
    write(chapter.title, 20, "bold", 14);

    const body = (chapter.content ?? "Capítulo ainda não gerado.").split("\n");
    for (const rawLine of body) {
      const line = rawLine.trimEnd();
      if (!line.trim()) {
        y += 6;
        continue;
      }
      if (/^#{4,}\s/.test(line)) write(clean(line.replace(/^#+\s/, "")), 12, "bold", 6);
      else if (/^###\s/.test(line)) write(clean(line.slice(4)), 13, "bold", 8);
      else if (/^##\s/.test(line)) write(clean(line.slice(3)), 16, "bold", 10);
      else if (/^#\s/.test(line)) write(clean(line.slice(2)), 18, "bold", 12);
      else if (/^\s*([-*+])\s+/.test(line)) write(`•  ${clean(line.replace(/^\s*([-*+])\s+/, ""))}`, 11.5, "normal", 2, 14);
      else if (/^\s*\d+\.\s+/.test(line)) write(clean(line.trim()), 11.5, "normal", 2, 14);
      else if (/^>/.test(line)) write(clean(line), 11.5, "italic", 6, 14);
      else write(clean(line), 11.5, "normal", 6);
    }
  });
  footer();

  // ---- Summary page ----
  doc.setPage(tocPageIndex);
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Sumário", M, y);
  y += 34;
  doc.setFontSize(11.5);
  for (const item of toc) {
    if (y > bottom) break;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(item.title, maxW - 40) as string[];
    doc.text(lines[0] ?? item.title, M, y);
    doc.text(String(item.page), W - M, y, { align: "right" });
    y += 20;
  }

  return doc;
}

export function downloadBookPdf(book: { title: string; styleLabel: string; chapters: PdfChapter[] }) {
  const doc = buildBookPdf(book);
  const name = book.title.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "livro";
  doc.save(`${name}.pdf`);
}
