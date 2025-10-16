export interface User {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
  email?: string;
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
  completed: boolean;
  assignedTo?: User[];
  reactions?: Reaction[];
  description?: string;
  due_date?: string;
  priority?: string;
  project_id?: string;
  created_by?: User;
  created_at?: string;
  status?: string;
  tags?: any[];
  origin_ticket_id?: string;
}