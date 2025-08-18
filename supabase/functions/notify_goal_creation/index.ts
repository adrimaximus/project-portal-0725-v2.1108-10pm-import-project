CREATE OR REPLACE FUNCTION public.notify_goal_creation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, description, link)
  VALUES (
    NEW.user_id,
    'goal', -- Use a more specific type for goals
    'Goal Created',
    'Your new goal "' || NEW.title || '" has been successfully created.',
    '/goals/' || NEW.slug
  );
  RETURN NEW;
END;
$function$