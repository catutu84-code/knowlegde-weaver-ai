import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const processMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { materialId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { extractFromBytes, isImage, extensionOf, bytesToBase64 } = await import(
      "./extract.server"
    );
    const { callAI } = await import("./ai.server");

    const { data: material, error } = await supabase
      .from("materials")
      .select("*")
      .eq("id", data.materialId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !material) throw new Error("Material não encontrado.");

    const finish = async (patch: {
      status: string;
      status_message?: string | null;
      extracted_text?: string | null;
    }) => {
      await supabase.from("materials").update(patch).eq("id", material.id);
      return patch;
    };

    if (material.source_kind !== "file") {
      const text = (material.extracted_text ?? "").trim();
      return finish(
        text
          ? { status: "ready", status_message: null }
          : {
              status: "unsupported",
              status_message: "Nenhum conteúdo de texto foi informado.",
            },
      );
    }

    if (!material.file_path) {
      return finish({ status: "unsupported", status_message: "Arquivo não encontrado." });
    }

    await supabase.from("materials").update({ status: "processing" }).eq("id", material.id);

    const download = await supabase.storage.from("materials").download(material.file_path);
    if (download.error || !download.data) {
      return finish({
        status: "unsupported",
        status_message: "Não conseguimos ler o arquivo enviado. Tente enviar novamente.",
      });
    }

    const bytes = new Uint8Array(await download.data.arrayBuffer());
    const fileName = material.file_name ?? material.title;
    const ext = extensionOf(fileName);

    if (isImage(ext, material.mime_type)) {
      try {
        const mime = material.mime_type ?? "image/png";
        const content = await callAI(
          [
            {
              role: "system",
              content:
                "Você transcreve materiais de estudo a partir de imagens. Devolva SOMENTE o texto e as informações visíveis na imagem, organizados em tópicos quando fizer sentido. Se não houver texto legível, descreva objetivamente o conteúdo de estudo mostrado.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Transcreva e organize o conteúdo de estudo desta imagem." },
                {
                  type: "image_url",
                  image_url: { url: `data:${mime};base64,${bytesToBase64(bytes)}` },
                },
              ],
            },
          ],
          { temperature: 0.2 },
        );
        const text = content.trim();
        if (text.length < 15) {
          return finish({
            status: "unsupported",
            status_message:
              "Não identificamos texto nesta imagem. Tente uma foto mais nítida ou cole o conteúdo como texto.",
          });
        }
        return finish({ status: "ready", status_message: null, extracted_text: text });
      } catch (err) {
        console.error("image ocr failed", err);
        return finish({
          status: "unsupported",
          status_message: "Não conseguimos ler o texto desta imagem agora. Tente novamente mais tarde.",
        });
      }
    }

    const result = await extractFromBytes(bytes, fileName, material.mime_type);
    return finish({
      status: result.status,
      status_message: result.message ?? null,
      extracted_text: result.text || null,
    });
  });
