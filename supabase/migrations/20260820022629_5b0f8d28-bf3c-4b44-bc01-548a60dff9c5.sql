ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS introduction text,
  ADD COLUMN IF NOT EXISTS generation_status text NOT NULL DEFAULT 'incomplete',
  ADD COLUMN IF NOT EXISTS generation_stage text,
  ADD COLUMN IF NOT EXISTS generation_error text,
  ADD COLUMN IF NOT EXISTS current_page integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reading_progress numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_version integer NOT NULL DEFAULT 1;

ALTER TABLE public.books
  ADD CONSTRAINT books_generation_status_check CHECK (generation_status IN ('generating', 'ready', 'incomplete', 'failed')),
  ADD CONSTRAINT books_current_page_check CHECK (current_page >= 0),
  ADD CONSTRAINT books_reading_progress_check CHECK (reading_progress >= 0 AND reading_progress <= 100),
  ADD CONSTRAINT books_current_version_check CHECK (current_version >= 1);

ALTER TABLE public.book_chapters
  ADD COLUMN IF NOT EXISTS source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

ALTER TABLE public.book_chapters
  ADD CONSTRAINT book_chapters_version_check CHECK (version >= 1);

CREATE TABLE public.book_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  version integer NOT NULL,
  reason text NOT NULL DEFAULT 'generation',
  title text NOT NULL,
  subtitle text,
  style text NOT NULL,
  custom_instruction text,
  material_ids uuid[] NOT NULL DEFAULT '{}',
  outline jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  chapters_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_versions TO authenticated;
GRANT ALL ON public.book_versions TO service_role;
ALTER TABLE public.book_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own book versions" ON public.book_versions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_book_versions_book ON public.book_versions(book_id, version DESC);

UPDATE public.books b
SET generation_status = CASE
  WHEN b.total_chapters > 0
    AND (SELECT count(*) FROM public.book_chapters c WHERE c.book_id = b.id AND length(trim(coalesce(c.content, ''))) >= 200) = b.total_chapters
  THEN 'ready'
  ELSE 'incomplete'
END,
generation_stage = CASE
  WHEN b.total_chapters > 0
    AND (SELECT count(*) FROM public.book_chapters c WHERE c.book_id = b.id AND length(trim(coalesce(c.content, ''))) >= 200) = b.total_chapters
  THEN 'Livro pronto'
  ELSE 'Geração incompleta'
END,
reading_progress = CASE
  WHEN b.total_chapters > 0
    AND (SELECT count(*) FROM public.book_chapters c WHERE c.book_id = b.id AND length(trim(coalesce(c.content, ''))) >= 200) = b.total_chapters
  THEN LEAST(100, GREATEST(0, ((b.current_chapter::numeric) / b.total_chapters::numeric) * 100))
  ELSE 0
END;