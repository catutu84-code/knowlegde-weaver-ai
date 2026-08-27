ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'pink',
  ADD COLUMN IF NOT EXISTS mascot_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reduced_motion boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_theme_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_theme_check CHECK (theme IN ('pink','blue','light','dark','system'));
  END IF;
END $$;