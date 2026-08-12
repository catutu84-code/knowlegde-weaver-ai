import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { FileUp, Link2, Loader2, Type, Upload } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { processMaterial } from "@/lib/materials.functions";
import { useCourses, useSubjects, useTopics } from "@/lib/library";
import { PageHeader } from "@/components/study/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/adicionar")({
  head: () => ({
    meta: [
      { title: "Adicionar material — Mentor IA" },
      { name: "description", content: "Envie PDFs, Word, Excel, slides, imagens, links ou texto para estudar com IA." },
    ],
  }),
  component: AddMaterialPage,
});

const ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.html,.htm,.png,.jpg,.jpeg,.webp";

function AddMaterialPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const process = useServerFn(processMaterial);
  const fileInput = useRef<HTMLInputElement>(null);

  const [courseId, setCourseId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const [textTitle, setTextTitle] = useState("");
  const [textBody, setTextBody] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const courses = useCourses();
  const subjects = useSubjects(courseId);
  const topics = useTopics(subjectId);

  async function createMaterial(payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from("materials")
      .insert({
        user_id: user!.id,
        course_id: courseId,
        subject_id: subjectId,
        topic_id: topicId,
        status: "processing",
        ...payload,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Falha ao criar material.");
    return data.id as string;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !user) return;
    setBusy(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        setProgress(`Enviando ${file.name}...`);
        const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const upload = await supabase.storage.from("materials").upload(path, file);
        if (upload.error) throw new Error(upload.error.message);

        const id = await createMaterial({
          title: file.name.replace(/\.[^.]+$/, ""),
          source_kind: "file",
          file_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
        });

        setProgress(`Processando ${file.name}...`);
        await process({ data: { materialId: id } });
        ok += 1;
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "erro ao processar"}`);
      }
    }
    setBusy(false);
    setProgress("");
    queryClient.invalidateQueries({ queryKey: ["materials"] });
    if (ok > 0) {
      toast.success(`${ok} material(is) pronto(s) para estudar!`);
      navigate({ to: "/biblioteca" });
    }
  }

  async function handleText() {
    if (!textBody.trim()) return toast.error("Cole ou escreva o conteúdo.");
    setBusy(true);
    try {
      const id = await createMaterial({
        title: textTitle.trim() || "Anotação",
        source_kind: "text",
        extracted_text: textBody,
      });
      await process({ data: { materialId: id } });
      toast.success("Material salvo!");
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      navigate({ to: "/biblioteca" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar.");
    }
    setBusy(false);
  }

  async function handleLink() {
    if (!linkUrl.trim()) return toast.error("Informe o link.");
    setBusy(true);
    try {
      const id = await createMaterial({
        title: linkTitle.trim() || linkUrl,
        source_kind: "link",
        file_name: linkUrl,
      });
      setProgress("Lendo página...");
      await process({ data: { materialId: id, url: linkUrl } });
      toast.success("Conteúdo do link processado!");
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      navigate({ to: "/biblioteca" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao ler o link.");
    }
    setBusy(false);
    setProgress("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Adicionar material"
        description="Envie arquivos, cole um texto ou um link. A IA vai ler tudo e usar só o seu conteúdo."
      />

      <div className="surface space-y-4 p-5">
        <h2 className="text-sm font-semibold">Onde guardar</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Curso</Label>
            <Select
              value={courseId ?? "none"}
              onValueChange={(v) => {
                setCourseId(v === "none" ? null : v);
                setSubjectId(null);
                setTopicId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem curso</SelectItem>
                {(courses.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Matéria</Label>
            <Select
              value={subjectId ?? "none"}
              onValueChange={(v) => {
                setSubjectId(v === "none" ? null : v);
                setTopicId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem matéria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem matéria</SelectItem>
                {(subjects.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Assunto</Label>
            <Select value={topicId ?? "none"} onValueChange={(v) => setTopicId(v === "none" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sem assunto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem assunto</SelectItem>
                {(topics.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Crie cursos, matérias e assuntos na Biblioteca para organizar melhor seus estudos.
        </p>
      </div>

      <Tabs defaultValue="file">
        <TabsList>
          <TabsTrigger value="file">
            <FileUp className="size-4" /> Arquivos
          </TabsTrigger>
          <TabsTrigger value="text">
            <Type className="size-4" /> Texto
          </TabsTrigger>
          <TabsTrigger value="link">
            <Link2 className="size-4" /> Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFiles(e.dataTransfer.files);
            }}
            className="surface flex flex-col items-center justify-center gap-3 border-dashed p-10 text-center"
          >
            <Upload className="size-8 text-primary" />
            <p className="text-sm font-medium">Arraste arquivos aqui ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground">
              PDF, Word, Excel, PowerPoint, imagens, HTML, TXT, CSV e Markdown
            </p>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
            <Button onClick={() => fileInput.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
              Selecionar arquivos
            </Button>
            {progress ? <p className="text-xs text-muted-foreground">{progress}</p> : null}
          </div>
        </TabsContent>

        <TabsContent value="text">
          <div className="surface space-y-3 p-5">
            <Input
              placeholder="Título do material"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
            />
            <Textarea
              rows={12}
              placeholder="Cole aqui o conteúdo, resumo ou anotação..."
              value={textBody}
              onChange={(e) => setTextBody(e.target.value)}
            />
            <Button onClick={handleText} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Salvar material
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="link">
          <div className="surface space-y-3 p-5">
            <Input placeholder="Título (opcional)" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
            <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            <Button onClick={handleLink} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Ler e salvar
            </Button>
            <p className="text-xs text-muted-foreground">
              Funciona com páginas públicas de texto. Vídeos e páginas que exigem login não podem ser lidos.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
