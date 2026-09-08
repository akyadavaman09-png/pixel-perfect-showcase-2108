
CREATE TYPE public.app_role AS ENUM ('citizen','staff','admin');
CREATE TYPE public.complaint_status AS ENUM ('pending','in_progress','completed','rejected');
CREATE TYPE public.complaint_category AS ENUM ('pothole','garbage','water','streetlight','drainage','traffic','safety','other');

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  category public.complaint_category UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  address text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'citizen',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.my_department()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT department_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE SEQUENCE public.complaint_code_seq START 1;

CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  citizen_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category public.complaint_category NOT NULL,
  description text NOT NULL,
  location_text text,
  latitude double precision,
  longitude double precision,
  image_url text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  assigned_staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.complaint_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  resolution_notes text,
  resolution_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.complaint_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_status public.complaint_status,
  to_status public.complaint_status,
  note text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaint_updates TO authenticated;
GRANT ALL ON public.complaint_updates TO service_role;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;

-- helper: can current user see a complaint
CREATE OR REPLACE FUNCTION public.can_view_complaint(_complaint_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = _complaint_id
      AND (
        c.citizen_id = auth.uid()
        OR public.has_role(auth.uid(),'admin')
        OR (public.has_role(auth.uid(),'staff') AND c.department_id = public.my_department())
      )
  )
$$;

-- policies: departments
CREATE POLICY "departments_read" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_admin_write" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- policies: profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_admin_delete" ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- policies: user_roles
CREATE POLICY "roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_write" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- policies: complaints
CREATE POLICY "complaints_select" ON public.complaints FOR SELECT TO authenticated
  USING (
    citizen_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'staff') AND department_id = public.my_department())
  );
CREATE POLICY "complaints_insert_own" ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (citizen_id = auth.uid());
CREATE POLICY "complaints_staff_update" ON public.complaints FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'staff') AND department_id = public.my_department()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'staff') AND department_id = public.my_department()));
CREATE POLICY "complaints_admin_delete" ON public.complaints FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- policies: complaint_updates
CREATE POLICY "updates_select" ON public.complaint_updates FOR SELECT TO authenticated
  USING (public.can_view_complaint(complaint_id));
CREATE POLICY "updates_insert" ON public.complaint_updates FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND public.can_view_complaint(complaint_id));

-- triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.complaints_before_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'CMP-' || lpad(nextval('public.complaint_code_seq')::text, 6, '0');
  END IF;
  IF NEW.department_id IS NULL THEN
    SELECT id INTO NEW.department_id FROM public.departments WHERE category = NEW.category LIMIT 1;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_complaints_code BEFORE INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.complaints_before_insert();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'citizen')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.departments (name, category, description) VALUES
  ('Roads Department','pothole','Road surfaces, potholes and pavement repair'),
  ('Sanitation Department','garbage','Waste collection and street cleaning'),
  ('Water Department','water','Water supply, leaks and quality'),
  ('Electricity Department','streetlight','Street lighting and public electricity'),
  ('Drainage Department','drainage','Storm drains, sewers and flooding'),
  ('Traffic Department','traffic','Signals, signage and traffic flow'),
  ('Public Safety Department','safety','Public safety hazards and incidents'),
  ('General Services Department','other','All other municipal service requests');
