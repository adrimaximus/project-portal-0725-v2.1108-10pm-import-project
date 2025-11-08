export type TaskAssignee = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
};

export type TaskTag = {
  id: string;
  name: string;
  color: string;
  user_id: string;
};

export type TaskAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
};

export type TaskReaction = {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
};

export type CreatedBy = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  priority: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  project_status: string;
  assignedTo: TaskAssignee[];
  created_by: CreatedBy;
  created_at: string;
  updated_at: string;
  status: string;
  tags: TaskTag[];
  origin_ticket_id: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachments: TaskAttachment[];
  project_venue: string | null;
  project_owner: CreatedBy;
  project_client: string | null;
  reactions: TaskReaction[];
  kanban_order: number;
  ticket_attachments: any[]; // Type this properly if needed
  last_reminder_sent_at: string | null;
};