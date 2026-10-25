-- Make the public lookup obey the querying user's permissions and RLS policies.
CREATE OR REPLACE VIEW public.public_businesses
WITH (security_invoker = true)
AS
SELECT id, name
FROM public.businesses;

-- The public review page needs to resolve a business name, but must not be
-- able to read private business columns such as owner_email.
DROP POLICY IF EXISTS "Anyone can read public business fields" ON public.businesses;

CREATE POLICY "Anyone can read public business fields"
  ON public.businesses
  FOR SELECT
  TO anon
  USING (true);

REVOKE SELECT ON public.businesses FROM anon;
GRANT SELECT (id, name) ON public.businesses TO anon;
GRANT SELECT ON public.public_businesses TO anon, authenticated;
