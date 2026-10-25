REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, INT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, INT, INT)
  TO service_role;

REVOKE ALL ON FUNCTION public.consume_business_creation_limit()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_business_creation_limit()
  TO authenticated;

DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable()
      FROM PUBLIC, anon, authenticated;
  END IF;
END
$$;
