export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  initials?: string;
  role?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id?: string;
}

export interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  project_id: string;
  created_by: User;
  assignees: User[];
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  tags?: Tag[];
  origin_ticket_id?: string;
  attachments?: Attachment[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  created_by: User;
  assignedTo: User[];
  tasks?: Task[];
  services?: string[];
  venue?: string;
}