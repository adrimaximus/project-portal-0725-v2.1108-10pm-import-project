CREATE OR REPLACE FUNCTION public.process_pending_notifications()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  request_id bigint;
  v_cron_secret text;
BEGIN
  SELECT decrypted_secret INTO v_cron_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';

  IF v_cron_secret IS NULL THEN
    RAISE EXCEPTION 'CRON_SECRET not found in vault. Cannot trigger notification processing.';
  END IF;

  SELECT net.http_post(
    url:='https://quuecudndfztjlxbrvyb.supabase.co/functions/v1/process-pending-notifications',
    body:='{}'::jsonb,
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_cron_secret
    )
  ) INTO request_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invoked process-pending-notifications function.',
    'request_id', request_id
  );
END;
$function$;