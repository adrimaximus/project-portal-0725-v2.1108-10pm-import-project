export interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export interface Collaborator extends User {
  role: string;
}

export interface Person {
  id: string;
  full_name: string;
  company?: string;
  company_id?: string | null;
  avatar_url?: string;
  custom_properties?: Record<string, any>;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  custom_properties?: Record<string, any>;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  status: TaskStatus;
  priority: string;
  due_date?: string;
  project_id: string;
  assignee_ids?: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  due_date?: string;
  budget?: number;
  venue?: string;
  services?: string[];
  payment_status: string;
  payment_due_date?: string;
  people?: Person[];
  person_ids?: string[];
  client_company_id?: string | null;
  tasks?: Task[];
}

export const PROJECT_STATUS_OPTIONS = [
  { value: 'Requested', label: 'Requested' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Bid Win', label: 'Bid Win' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'Completed', label: 'Completed' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Bid Lost', label: 'Bid Lost' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const PAYMENT_STATUS_OPTIONS = [
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Partially Paid', label: 'Partially Paid' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' },
];

export type TaskStatus = 'To do' | 'In Progress' | 'Done' | 'Cancelled';

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To do', label: 'To do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Done', label: 'Done' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
];

export interface ContactProperty {
  id: string;
  name: string;
  type: 'Text' | 'Number' | 'Date' | 'Select';
  options?: string[];
}

export interface CompanyProperty {
  id: string;
  name: string;
  type: 'Text' | 'Number' | 'Date' | 'Select';
  options?: string[];
}

export const CONTACT_PROPERTY_TYPES = ['Text', 'Number', 'Date', 'Select'];
export const COMPANY_PROPERTY_TYPES = ['Text', 'Number', 'Date', 'Select'];