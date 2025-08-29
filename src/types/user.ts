export interface Profile {
  id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  role?: string;
  status?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email?: string;
  name: string;
  avatar_url?: string;
  initials: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string;
  status?: string;
  sidebar_order?: string[];
  updated_at?: string;
  permissions?: string[];
}

export type Collaborator = User & { online?: boolean };
export type AssignedUser = User;