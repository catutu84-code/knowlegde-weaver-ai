CREATE TABLE public.game_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  coins integer NOT NULL DEFAULT 0,
  game_xp integer NOT NULL DEFAULT 0,
  equipped jsonb NOT NULL DEFAULT '{"expression":"padrao","glasses":"classic","outfit":"student","accessory":"book","environment":"study-room","color":"default"}'::jsonb,
  unlocked_items text[] NOT NULL DEFAULT ARRAY['expression:padrao','glasses:classic','outfit:student','accessory:book','environment:study-room','color:default']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_profiles TO authenticated;
GRANT ALL ON public.game_profiles TO service_role;
ALTER TABLE public.game_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own game profile" ON public.game_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_game_profiles_updated BEFORE UPDATE ON public.game_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.material_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  themes jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtopics jsonb NOT NULL DEFAULT '[]'::jsonb,
  concepts jsonb NOT NULL DEFAULT '[]'::jsonb,
  processes jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_fingerprint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (material_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_insights TO authenticated;
GRANT ALL ON public.material_insights TO service_role;
ALTER TABLE public.material_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own material insights" ON public.material_insights FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_material_insights_updated BEFORE UPDATE ON public.material_insights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  mode text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  difficulty integer NOT NULL DEFAULT 1,
  current_index integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  wrong_count integer NOT NULL DEFAULT 0,
  hints_used integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  coins_earned integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own game sessions" ON public.game_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_game_sessions_user_recent ON public.game_sessions(user_id, started_at DESC);
CREATE INDEX idx_game_sessions_material ON public.game_sessions(material_id, user_id);
CREATE TRIGGER trg_game_sessions_updated BEFORE UPDATE ON public.game_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.game_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position integer NOT NULL,
  phase text NOT NULL,
  challenge_type text NOT NULL,
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  explanation text NOT NULL,
  concept text NOT NULL,
  source_ref text NOT NULL,
  source_excerpt text,
  justification_required boolean NOT NULL DEFAULT false,
  difficulty integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, position)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_challenges TO authenticated;
GRANT ALL ON public.game_challenges TO service_role;
ALTER TABLE public.game_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own game challenges" ON public.game_challenges FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.game_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.game_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  answer text NOT NULL,
  justification text,
  is_correct boolean NOT NULL,
  mastery_signal text NOT NULL DEFAULT 'developing',
  response_ms integer NOT NULL DEFAULT 0,
  hint_used boolean NOT NULL DEFAULT false,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, challenge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_answers TO authenticated;
GRANT ALL ON public.game_answers TO service_role;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own game answers" ON public.game_answers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.concept_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  concept text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  attempts integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  average_response_ms integer NOT NULL DEFAULT 0,
  needs_review boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, material_id, concept)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concept_mastery TO authenticated;
GRANT ALL ON public.concept_mastery TO service_role;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own concept mastery" ON public.concept_mastery FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_concept_mastery_review ON public.concept_mastery(user_id, needs_review, updated_at);
CREATE TRIGGER trg_concept_mastery_updated BEFORE UPDATE ON public.concept_mastery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();