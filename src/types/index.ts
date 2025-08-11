export type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    first_name?: string;
    last_name?: string;
  };
};

export type SupabaseSession = {
  user: SupabaseUser;
} | null;

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

export type User = Profile & {
  name: string;
  initials: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
};

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: UserProfile[];
};

export type Comment = {
  id: string;
  is_ticket: boolean;
};

export type Project = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  status: string | null;
  progress: number;
  budget: number | null;
  startDate: string | null; // ISO date string
  dueDate: string | null; // ISO date string
  paymentStatus: string | null;
  createdBy: UserProfile;
  assignedTo: UserProfile[];
  tasks: Task[];
  comments: Comment[];
};