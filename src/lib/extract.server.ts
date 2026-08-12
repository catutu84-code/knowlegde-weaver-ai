import { unzipSync, strFromU8 } from "fflate";

export type ExtractResult = {
  status: "ready" | "unsupported";
  text: string;
  message?: string;
};

const TEXT_EXT = ["txt", "md", "markdown", "csv", "json", "rtf", "log", "tsv"];
const HTML_EXT = ["html", "htm", "xhtml"];
const ZIP_DOC_EXT = ["docx", "pptx", "xlsx", "odt", "odp", "ods"];
const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "heic", "heif"];

export function extensionOf(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() as string) : "";
}

export function isImage(ext: string, mime?: string | null): boolean {
  return IMAGE_EXT.includes(ext) || (mime ?? "").startsWith("image/");
}

function cleanup(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function stripHtml(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const withBreaks = withoutNoise
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const text = withBreaks.replace(/<[^>]+>/g, " ");
  return cleanup(
    text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'"),
  );
}

function xmlText(xml: string): string {
  return cleanup(
    xml
      .replace(/<\/(w:p|a:p|text:p|row|Row)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return cleanup(Array.isArray(text) ? text.join("\n\n") : text);
}

function extractZipDoc(bytes: Uint8Array, ext: string): string {
  const files = unzipSync(bytes);
  const chunks: string[] = [];

  const pick = (predicate: (name: string) => boolean) =>
    Object.keys(files)
      .filter(predicate)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (ext === "docx") {
    for (const name of pick((n) => n === "word/document.xml" || n.startsWith("word/header") || n.startsWith("word/footnotes"))) {
      chunks.push(xmlText(strFromU8(files[name]!)));
    }
  } else if (ext === "pptx") {
    for (const name of pick((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
      const label = name.replace(/^ppt\/slides\//, "").replace(".xml", "");
      chunks.push(`[${label}]\n${xmlText(strFromU8(files[name]!))}`);
    }
  } else if (ext === "xlsx") {
    const shared = files["xl/sharedStrings.xml"];
    const strings: string[] = [];
    if (shared) {
      const raw = strFromU8(shared);
      for (const match of raw.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) strings.push(match[1] ?? "");
    }
    if (strings.length) chunks.push(strings.join(" | "));
    for (const name of pick((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))) {
      chunks.push(xmlText(strFromU8(files[name]!)));
    }
  } else {
    const content = files["content.xml"];
    if (content) chunks.push(xmlText(strFromU8(content)));
  }

  return cleanup(chunks.join("\n\n"));
}

export async function extractFromBytes(
  bytes: Uint8Array,
  fileName: string,
  mimeType?: string | null,
): Promise<ExtractResult> {
  const ext = extensionOf(fileName);

  try {
    if (TEXT_EXT.includes(ext) || (mimeType ?? "").startsWith("text/plain")) {
      return { status: "ready", text: cleanup(strFromU8(bytes)) };
    }
    if (HTML_EXT.includes(ext) || (mimeType ?? "").includes("html")) {
      return { status: "ready", text: stripHtml(strFromU8(bytes)) };
    }
    if (ext === "pdf" || (mimeType ?? "").includes("pdf")) {
      const text = await extractPdf(bytes);
      if (text.length < 40) {
        return {
          status: "unsupported",
          text: "",
          message:
            "Este PDF parece ser digitalizado (apenas imagens). Envie as páginas como imagens ou cole o texto para que a IA possa estudar com você.",
        };
      }
      return { status: "ready", text };
    }
    if (ZIP_DOC_EXT.includes(ext)) {
      const text = extractZipDoc(bytes, ext);
      if (text.length < 20) {
        return {
          status: "unsupported",
          text: "",
          message: "Não encontramos texto neste arquivo. Tente converter para PDF ou colar o conteúdo.",
        };
      }
      return { status: "ready", text };
    }
  } catch (error) {
    console.error("extraction failed", fileName, error);
    return {
      status: "unsupported",
      text: "",
      message:
        "Este arquivo foi armazenado, mas não conseguimos extrair o conteúdo automaticamente. Você pode converter para PDF, enviar como imagem ou colar o conteúdo como texto.",
    };
  }

  return {
    status: "unsupported",
    text: "",
    message:
      "Este arquivo foi armazenado, mas ainda não conseguimos extrair seu conteúdo automaticamente. Você pode converter para PDF, enviar como imagem ou colar o conteúdo como texto.",
  };
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
