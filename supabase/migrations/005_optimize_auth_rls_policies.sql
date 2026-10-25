DROP POLICY IF EXISTS "Authenticated users can read their own business" ON public.businesses;

CREATE POLICY "Authenticated users can read their own business"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (owner_email = (SELECT auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Authenticated users can insert their own business" ON public.businesses;

CREATE POLICY "Authenticated users can insert their own business"
  ON public.businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_email = (SELECT auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Business owners can read their reviews" ON public.reviews;

CREATE POLICY "Business owners can read their reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_email = (SELECT auth.jwt() ->> 'email')
    )
  );
