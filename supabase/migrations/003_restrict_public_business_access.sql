DROP POLICY IF EXISTS "Anyone can read business name" ON public.businesses;

CREATE OR REPLACE VIEW public.public_businesses AS
SELECT id, name
FROM public.businesses;

GRANT SELECT ON public.public_businesses TO anon, authenticated;
