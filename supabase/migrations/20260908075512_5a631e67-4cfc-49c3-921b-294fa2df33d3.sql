
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_department() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_complaint(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_department() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_complaint(uuid) TO authenticated;
