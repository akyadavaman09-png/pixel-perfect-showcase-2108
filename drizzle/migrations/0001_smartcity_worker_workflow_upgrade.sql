-- ============ SmartCity worker workflow + RBAC upgrade ============

-- 1. New workflow statuses (Submitted=pending -> under_review -> approved -> assigned -> in_progress -> pending_verification -> completed)
ALTER TYPE public.complaint_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.complaint_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.complaint_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.complaint_status ADD VALUE IF NOT EXISTS 'pending_verification';

-- 2. Priority + due date
CREATE TYPE public.complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
ALTER TABLE public.complaints ADD COLUMN priority public.complaint_priority NOT NULL DEFAULT 'medium';
ALTER TABLE public.complaints ADD COLUMN due_date timestamptz;
COMMENT ON COLUMN public.complaints.priority IS 'Admin-set priority: low, medium, high, urgent';
COMMENT ON COLUMN public.complaints.due_date IS 'Admin-set target completion date; used for overdue flags';

-- 3. Worker active flag
ALTER TABLE public.profiles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.profiles.is_active IS 'Inactive workers do not receive new assignments';

-- 4. Update visibility (citizens/public see public rows only)
ALTER TABLE public.complaint_updates ADD COLUMN visibility text NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public', 'internal'));
COMMENT ON COLUMN public.complaint_updates.visibility IS 'public rows are visible to the citizen and tracking page; internal rows are admin/staff only';

-- 5. Assignment history (append-only reassignment trail)
CREATE TABLE public.complaint_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  note text
);
CREATE INDEX idx_complaint_assignments_complaint ON public.complaint_assignments (complaint_id);
CREATE INDEX idx_complaint_assignments_worker ON public.complaint_assignments (worker_id);
GRANT SELECT, INSERT ON public.complaint_assignments TO authenticated;
GRANT ALL ON public.complaint_assignments TO service_role;
ALTER TABLE public.complaint_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assignments_select ON public.complaint_assignments FOR SELECT TO authenticated
  USING (worker_id = auth.uid() OR public.can_view_complaint(complaint_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY assignments_insert ON public.complaint_assignments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Attachments (progress / resolution evidence)
CREATE TABLE public.complaint_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'progress' CHECK (kind IN ('complaint', 'progress', 'resolution')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaint_attachments_complaint ON public.complaint_attachments (complaint_id);
GRANT SELECT, INSERT ON public.complaint_attachments TO authenticated;
GRANT ALL ON public.complaint_attachments TO service_role;
ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY attachments_select ON public.complaint_attachments FOR SELECT TO authenticated
  USING (public.can_view_complaint(complaint_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY attachments_insert ON public.complaint_attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND public.can_view_complaint(complaint_id));

-- 7. Complaint visibility scoped to the assigned worker (staff no longer see the whole department)
CREATE OR REPLACE FUNCTION public.can_view_complaint(_complaint_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = _complaint_id
      AND (
        c.citizen_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR (public.has_role(auth.uid(), 'staff') AND c.assigned_staff_id = auth.uid())
      )
  )
$function$;

DROP POLICY IF EXISTS complaints_select ON public.complaints;
CREATE POLICY complaints_select ON public.complaints FOR SELECT TO authenticated
  USING (
    (citizen_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'staff') AND assigned_staff_id = auth.uid())
  );

-- Workers act only through validated RPCs; direct table updates become admin-only.
DROP POLICY IF EXISTS complaints_staff_update ON public.complaints;
CREATE POLICY complaints_admin_update ON public.complaints FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 8. Update timeline: citizens see public rows only; only admins/assigned workers may write
DROP POLICY IF EXISTS updates_select ON public.complaint_updates;
CREATE POLICY updates_select ON public.complaint_updates FOR SELECT TO authenticated
  USING (
    public.can_view_complaint(complaint_id)
    AND (
      visibility = 'public'
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'staff')
    )
  );
DROP POLICY IF EXISTS updates_insert ON public.complaint_updates;
CREATE POLICY updates_insert ON public.complaint_updates FOR INSERT TO authenticated
  WITH CHECK (
    (has_role(auth.uid(), 'admin') AND actor_id = auth.uid())
    OR (has_role(auth.uid(), 'staff') AND actor_id = auth.uid() AND public.can_view_complaint(complaint_id))
  );

-- 9. Non-guessable tracking codes
CREATE UNIQUE INDEX IF NOT EXISTS complaints_code_uidx ON public.complaints (code);
CREATE OR REPLACE FUNCTION public.complaints_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  i int;
  s text;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    LOOP
      s := '';
      FOR i IN 1..6 LOOP
        s := s || substr(chars, 1 + floor(random() * length(chars))::int, 1);
      END LOOP;
      NEW.code := 'CMP-' || s;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.complaints WHERE code = NEW.code);
    END LOOP;
  END IF;
  IF NEW.department_id IS NULL THEN
    SELECT id INTO NEW.department_id FROM public.departments WHERE category = NEW.category LIMIT 1;
  END IF;
  RETURN NEW;
END; $function$;

-- 10. Worker actions (validated server-side; workers cannot change assignments, roles or priorities)
CREATE OR REPLACE FUNCTION public.worker_task_action(
  _complaint_id uuid,
  _action text,
  _note text DEFAULT NULL,
  _image_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.complaints%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.complaints WHERE id = _complaint_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Complaint not found'; END IF;
  IF c.assigned_staff_id IS NULL OR c.assigned_staff_id <> auth.uid() THEN
    RAISE EXCEPTION 'This task is not assigned to you';
  END IF;

  IF _action = 'accept' THEN
    IF c.status NOT IN ('approved', 'assigned') THEN RAISE EXCEPTION 'This task is not waiting to be accepted'; END IF;
    INSERT INTO public.complaint_updates (complaint_id, actor_id, from_status, to_status, note, visibility)
    VALUES (_complaint_id, auth.uid(), c.status, c.status, COALESCE(NULLIF(btrim(_note), ''), 'Task accepted by the field worker'), 'public');
  ELSIF _action = 'start' THEN
    IF c.status <> 'assigned' THEN RAISE EXCEPTION 'Only assigned tasks can be started'; END IF;
    UPDATE public.complaints SET status = 'in_progress' WHERE id = _complaint_id;
    INSERT INTO public.complaint_updates (complaint_id, actor_id, from_status, to_status, note, visibility)
    VALUES (_complaint_id, auth.uid(), 'assigned', 'in_progress', COALESCE(NULLIF(btrim(_note), ''), 'Work started on this task'), 'public');
  ELSIF _action = 'progress' THEN
    IF c.status <> 'in_progress' THEN RAISE EXCEPTION 'Start the task before adding progress'; END IF;
    IF (COALESCE(btrim(_note), '') = '' AND _image_url IS NULL) THEN RAISE EXCEPTION 'Add a note or a photo'; END IF;
    INSERT INTO public.complaint_updates (complaint_id, actor_id, from_status, to_status, note, image_url, visibility)
    VALUES (_complaint_id, auth.uid(), 'in_progress', 'in_progress', NULLIF(btrim(_note), ''), _image_url, 'public');
  ELSIF _action = 'complete' THEN
    IF c.status <> 'in_progress' THEN RAISE EXCEPTION 'Only work in progress can be submitted for verification'; END IF;
    UPDATE public.complaints
      SET status = 'pending_verification', resolution_notes = NULLIF(btrim(_note), ''), resolution_image_url = _image_url
      WHERE id = _complaint_id;
    INSERT INTO public.complaint_updates (complaint_id, actor_id, from_status, to_status, note, image_url, visibility)
    VALUES (_complaint_id, auth.uid(), 'in_progress', 'pending_verification', COALESCE(NULLIF(btrim(_note), ''), 'Work completed and submitted for verification'), _image_url, 'public');
  ELSE
    RAISE EXCEPTION 'Unknown action';
  END IF;
END; $function$;

-- 11. Admin verification + reopen (audit row written in the same transaction)
CREATE OR REPLACE FUNCTION public.admin_completion_decision(
  _complaint_id uuid,
  _approve boolean,
  _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.complaints%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only administrators can verify completions'; END IF;
  SELECT * INTO c FROM public.complaints WHERE id = _complaint_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Complaint not found'; END IF;
  IF c.status <> 'pending_verification' THEN RAISE EXCEPTION 'This complaint is not awaiting verification'; END IF;
  IF _approve THEN
    UPDATE public.complaints SET status = 'completed', resolved_at = now() WHERE id = _complaint_id;
    INSERT INTO public.complaint_updates (complaint_id, actor_id, from_status, to_status, note, visibility)
    VALUES (_complaint_id, auth.uid(), 'pending_verification', 'completed', COALESCE(NULLIF(btrim(_note), ''), 'Completed work verified by the administrator'), 'public');
  ELSE
    UPDATE public.complaints SET status = 'in_progress' WHERE id = _complaint_id;
    INSERT INTO public.complaint_updates (complaint_id, actor_id, from_status, to_status, note, visibility)
    VALUES (_complaint_id, auth.uid(), 'pending_verification', 'in_progress', COALESCE(NULLIF(btrim(_note), ''), 'Completion returned by the administrator for rework'), 'public');
  END IF;
END; $function$;

CREATE OR REPLACE FUNCTION public.admin_reopen_complaint(_complaint_id uuid, _note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.complaints%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only administrators can reopen complaints'; END IF;
  SELECT * INTO c FROM public.complaints WHERE id = _complaint_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Complaint not found'; END IF;
  IF c.status <> 'completed' THEN RAISE EXCEPTION 'Only completed complaints can be reopened'; END IF;
  UPDATE public.complaints SET status = 'in_progress', resolved_at = NULL WHERE id = _complaint_id;
  INSERT INTO public.complaint_updates (complaint_id, actor_id, from_status, to_status, note, visibility)
  VALUES (_complaint_id, auth.uid(), 'completed', 'in_progress', COALESCE(NULLIF(btrim(_note), ''), 'Complaint reopened by the administrator'), 'public');
END; $function$;

-- 12. Public tracking lookups (only explicitly permitted fields, requires the exact code)
CREATE OR REPLACE FUNCTION public.track_lookup(_code text)
RETURNS TABLE (
  code text,
  title text,
  category public.complaint_category,
  status public.complaint_status,
  priority public.complaint_priority,
  department_name text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT c.code, c.title, c.category, c.status, c.priority, d.name,
         c.created_at, c.updated_at, c.resolved_at, c.resolution_notes
  FROM public.complaints c
  LEFT JOIN public.departments d ON d.id = c.department_id
  WHERE upper(c.code) = upper(btrim(_code))
$function$;

CREATE OR REPLACE FUNCTION public.track_timeline(_code text)
RETURNS TABLE (
  to_status public.complaint_status,
  note text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT u.to_status, u.note, u.created_at
  FROM public.complaint_updates u
  JOIN public.complaints c ON c.id = u.complaint_id
  WHERE upper(c.code) = upper(btrim(_code))
    AND u.visibility = 'public'
  ORDER BY u.created_at ASC
$function$;

REVOKE EXECUTE ON FUNCTION public.worker_task_action(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.worker_task_action(uuid, text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_completion_decision(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_completion_decision(uuid, boolean, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_reopen_complaint(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reopen_complaint(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_lookup(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_timeline(text) TO anon, authenticated;

-- 13. Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_staff ON public.complaints (assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON public.complaints (department_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_complaint ON public.complaint_updates (complaint_id);
