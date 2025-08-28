export interface TaskAssignee {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_by: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  priority?: string;
  project_id: string;
  projects?: ProjectSummary;
  assignees?: TaskAssignee[];
}