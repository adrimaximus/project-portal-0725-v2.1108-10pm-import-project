-- Create projects table
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  status TEXT,
  progress INT DEFAULT 0,
  budget NUMERIC,
  start_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  payment_status TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  services TEXT[]
);

-- Enable RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create project_members join table
CREATE TABLE public.project_members (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (project_id, user_id)
);

-- Enable RLS for project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects table
CREATE POLICY "Allow read access to project members" ON public.projects FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()));
CREATE POLICY "Allow insert for authenticated users" ON public.projects FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Allow update for project members" ON public.projects FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()));
CREATE POLICY "Allow delete for project owners" ON public.projects FOR DELETE TO authenticated USING (created_by = auth.uid());

-- RLS Policies for project_members table
CREATE POLICY "Allow read access to own membership" ON public.project_members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Allow project owners to manage members" ON public.project_members FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_members.project_id AND projects.created_by = auth.uid()));

-- Function and Trigger to automatically add creator as a project member
CREATE OR REPLACE FUNCTION public.add_creator_to_project_members()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (new.id, new.created_by, 'owner');
  RETURN new;
END;
$$;

CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.add_creator_to_project_members();