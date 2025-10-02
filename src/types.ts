// Versi sederhana dari tipe data untuk fitur ini.
// Ini dapat diperluas nanti berdasarkan struktur data yang sebenarnya.

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  initials?: string;
  first_name?: string;
  last_name?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  project_id: string;
  project_name: string;
  project_slug: string;
  assignees: User[];
  created_by: User;
  due_date?: string;
  priority?: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  status: string;
  payment_status: string;
  assignedTo: User[];
  tasks: Task[];
}