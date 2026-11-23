-- Add constraints as NOT VALID first. This avoids a full-table scan and normally
-- completes quickly. PostgreSQL still enforces these checks on inserts/updates;
-- existing rows can be validated separately after this migration.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'businesses_name_length'
      AND conrelid = 'public.businesses'::regclass
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_name_length
      CHECK (char_length(btrim(name)) BETWEEN 1 AND 120) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_transcript_length'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_transcript_length
      CHECK (char_length(transcript) BETWEEN 1 AND 10000) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_sentiment_score_range'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_sentiment_score_range
      CHECK (sentiment_score BETWEEN 0 AND 1) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_keywords_count'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_keywords_count
      CHECK (cardinality(keywords) <= 6) NOT VALID;
  END IF;
END
$$;
