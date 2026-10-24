-- EchoReview MVP Database Schema
-- Run this migration in your Supabase SQL editor

-- ============================================
-- Table: businesses
-- ============================================
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: reviews
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score FLOAT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  star_rating INT NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_reviews_business_id ON reviews(business_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- ============================================
-- Row Level Security
-- ============================================

-- Enable RLS on businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read businesses they own
CREATE POLICY "Authenticated users can read their own business"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (owner_email = auth.jwt() ->> 'email');

-- Authenticated users can insert their own business
CREATE POLICY "Authenticated users can insert their own business"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_email = auth.jwt() ->> 'email');

-- Allow anon users to read business name (for review page)
CREATE POLICY "Anyone can read business name"
  ON businesses
  FOR SELECT
  TO anon
  USING (true);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert reviews (customer submission)
CREATE POLICY "Anyone can insert reviews"
  ON reviews
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read reviews for their business
CREATE POLICY "Business owners can read their reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_email = auth.jwt() ->> 'email'
    )
  );

-- Allow service role full access (for API routes)
CREATE POLICY "Service role full access to reviews"
  ON reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Enable Real-time on reviews
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

-- ============================================
-- Rate limiting
-- ============================================

CREATE TABLE rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INT NOT NULL DEFAULT 0
);

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_bucket_key TEXT,
  p_limit INT,
  p_window_seconds INT
)
RETURNS TABLE (allowed BOOLEAN, retry_after_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_bucket rate_limit_buckets%ROWTYPE;
  seconds_remaining INT;
BEGIN
  INSERT INTO rate_limit_buckets (bucket_key)
  VALUES (p_bucket_key)
  ON CONFLICT (bucket_key) DO NOTHING;

  SELECT * INTO current_bucket
  FROM rate_limit_buckets
  WHERE bucket_key = p_bucket_key
  FOR UPDATE;

  IF current_bucket.window_started_at + make_interval(secs => p_window_seconds) <= NOW() THEN
    UPDATE rate_limit_buckets
    SET window_started_at = NOW(), request_count = 1
    WHERE bucket_key = p_bucket_key;
    RETURN QUERY SELECT TRUE, 0;
    RETURN;
  END IF;

  seconds_remaining := GREATEST(
    1,
    CEIL(EXTRACT(EPOCH FROM (
      current_bucket.window_started_at + make_interval(secs => p_window_seconds) - NOW()
    )))::INT
  );

  IF current_bucket.request_count >= p_limit THEN
    RETURN QUERY SELECT FALSE, seconds_remaining;
    RETURN;
  END IF;

  UPDATE rate_limit_buckets
  SET request_count = request_count + 1
  WHERE bucket_key = p_bucket_key;

  RETURN QUERY SELECT TRUE, 0;
END;
$$;

REVOKE ALL ON FUNCTION consume_rate_limit(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_rate_limit(TEXT, INT, INT) TO service_role;

CREATE OR REPLACE FUNCTION consume_business_creation_limit()
RETURNS TABLE (allowed BOOLEAN, retry_after_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT FALSE, 3600;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT * FROM consume_rate_limit(
    'business-create:user:' || auth.uid()::TEXT,
    3,
    3600
  );
END;
$$;

REVOKE ALL ON FUNCTION consume_business_creation_limit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_business_creation_limit() TO authenticated;
