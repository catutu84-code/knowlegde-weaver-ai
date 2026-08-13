CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  style text NOT NULL DEFAULT 'simples',
  custom_instruction text,
  scope text NOT NULL DEFAULT 'subject',
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  material_ids uuid[] NOT NULL DEFAULT '{}',
  outline jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_chapter integer NOT NULL DEFAULT 0,
  total_chapters integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own books" ON public.books FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_books_updated BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.book_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position integer NOT NULL,
  title text NOT NULL,
  summary text,
  content text,
  style text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, position)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_chapters TO authenticated;
GRANT ALL ON public.book_chapters TO service_role;
ALTER TABLE public.book_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own book chapters" ON public.book_chapters FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_book_chapters_updated BEFORE UPDATE ON public.book_chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.book_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_position integer NOT NULL DEFAULT 0,
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'highlight',
  excerpt text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_notes TO authenticated;
GRANT ALL ON public.book_notes TO service_role;
ALTER TABLE public.book_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own book notes" ON public.book_notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_books_user ON public.books(user_id, created_at DESC);
CREATE INDEX idx_book_chapters_book ON public.book_chapters(book_id, position);
CREATE INDEX idx_book_notes_book ON public.book_notes(book_id, chapter_position);