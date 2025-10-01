export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  initials: string;
  role?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  originTicketId: string | null;
  assignedTo: UserProfile[];
  createdBy: UserProfile;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  isTicket: boolean;
  attachment_url: string | null;
  attachment_name: string | null;
  author: UserProfile;
}

export interface BriefFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storage_path: string;
  created_at: string;
}

export interface Activity {
  id: string;
  type: string;
  details: { description: string };
  timestamp: string;
  user: UserProfile;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  status: string | null;
  progress: number | null;
  budget: number | null;
  start_date: string | null;
  due_date: string | null;
  payment_status: string;
  payment_due_date: string | null;
  origin_event_id: string | null;
  venue: string | null;
  created_by: UserProfile;
  assignedTo: UserProfile[];
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: BriefFile[];
  activities: Activity[];
  tags: Tag[];
}

export interface MoodEntry {
  id: string;
  mood_id: number;
  date: string;
  created_at: string;
}