export type UserNavigationItem = {
  id: string;
  user_id: string;
  name: string;
  url: string;
  position: number;
  created_at: string;
  is_enabled: boolean;
  icon: string | null;
  folder_id: string | null;
  is_deletable: boolean;
  is_editable: boolean;
  type: string;
  slug: string | null;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  status: string | null;
  progress: number;
  budget: number | null;
  start_date: string | null;
  due_date: string | null;
  payment_status: string;
  payment_due_date: string | null;
  origin_event_id: string | null;
  venue: string | null;
  created_by: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    initials: string;
  };
  assignedTo: any[];
  tasks: any[];
  comments: any[];
  services: string[];
  briefFiles: any[];
  activities: any[];
  tags: any[];
};