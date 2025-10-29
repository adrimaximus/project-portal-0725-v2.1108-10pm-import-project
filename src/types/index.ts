export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  progress?: number;
  budget?: number;
  start_date?: string;
  due_date?: string;
  payment_status: string;
  payment_due_date?: string;
  origin_event_id?: string;
  venue?: string;
  created_by: { id: string; name: string; email: string; avatar_url: string; initials: string; };
  assignedTo?: any[];
  tasks?: { id: string; title: string; completed: boolean; }[];
  comments?: any[];
  services?: string[];
  briefFiles?: any[];
  activities?: any[];
  tags?: { id: string; name: string; color: string; }[];
  client_name?: string;
  client_avatar_url?: string;
  client_company_logo_url?: string;
  client_company_name?: string;
  client_company_custom_properties?: any;
  client_company_id?: string | null;
  reactions?: any[];
  public?: boolean;
  people?: Person[];
  person_ids?: string[];
}

export interface User {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface Person {
  id: string;
  full_name: string;
  company?: string;
  company_id?: string | null;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  custom_properties?: Record<string, any>;
}

export const PROJECT_STATUS_OPTIONS = [
  { value: 'Idea', label: 'Idea' },
  { value: 'Requested', label: 'Requested' },
  { value: 'On Track', label: 'On Track' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Due', label: 'Due' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export type Collaborator = {
  id: string;
  name: string;
  avatar_url: string | null;
  initials: string;
  isIdle: boolean;
  last_active_at: string | null;
};

export type ConversationMessage = {
  sender: 'user' | 'ai';
  content: string;
};