ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS last_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.quiz_answers
  ADD COLUMN IF NOT EXISTS response_ms integer;

ALTER TABLE public.flashcards
  ADD COLUMN IF NOT EXISTS due_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.study_rhythm
  ADD COLUMN IF NOT EXISTS reminder_days integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  ADD COLUMN IF NOT EXISTS reminder_time time NOT NULL DEFAULT '19:00',
  ADD COLUMN IF NOT EXISTS reminder_kinds text[] NOT NULL DEFAULT ARRAY['estudo','revisao','prova'];

ALTER TABLE public.mind_maps
  ADD COLUMN IF NOT EXISTS source_material_ids uuid[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_books_user_last_opened ON public.books (user_id, last_opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_due ON public.flashcards (user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_user_created ON public.quiz_answers (user_id, created_at DESC);