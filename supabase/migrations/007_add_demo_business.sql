-- Seed the public, isolated business used by the unauthenticated product demo.
INSERT INTO public.businesses (id, name, owner_email)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'JustSay Demo',
  'demo@justsay.app'
)
ON CONFLICT (id) DO NOTHING;