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
-- Seed Data: Demo Business
-- ============================================
INSERT INTO businesses (id, name, owner_email)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Salon',
  'demo@justsay.app'
);
