export interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  priority: string | null;
  project_id: string;
  project_name: string | null;
  project_slug: string | null;
  project_status: string | null;
  assignedTo: User[] | null;
  created_by: User | null;
  created_at: string;
  updated_at: string;
  status: string;
  tags: Tag[] | null;
  originTicketId: string | null;
  attachments: TaskAttachment[] | null;
  ticket_attachments: TaskAttachment[] | null;
  reactions: Reaction[] | null;
}