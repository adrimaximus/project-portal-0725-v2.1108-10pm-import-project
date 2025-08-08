-- Create tasks table
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  origin_ticket_id TEXT
);

-- Enable RLS for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create task_assignees join table
CREATE TABLE public.task_assignees (
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (task_id, user_id)
);

-- Enable RLS for task_assignees
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- Create comments table
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  text TEXT,
  is_ticket BOOLEAN DEFAULT FALSE,
  attachment_name TEXT,
  attachment_url TEXT
);

-- Enable RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks table
CREATE POLICY "Allow access to project members for tasks" ON public.tasks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = tasks.project_id AND project_members.user_id = auth.uid()));

-- RLS Policies for task_assignees table
CREATE POLICY "Allow access to project members for task assignees" ON public.task_assignees FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.tasks t JOIN public.project_members pm ON t.project_id = pm.project_id WHERE t.id = task_assignees.task_id AND pm.user_id = auth.uid()));

-- RLS Policies for comments table
CREATE POLICY "Allow read access to project members for comments" ON public.comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = comments.project_id AND project_members.user_id = auth.uid()));
CREATE POLICY "Allow insert for project members for comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.project_members WHERE project_members.project_id = comments.project_id AND project_members.user_id = auth.uid()));
CREATE POLICY "Allow update for comment authors" ON public.comments FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Allow delete for comment authors" ON public.comments FOR DELETE TO authenticated USING (author_id = auth.uid());