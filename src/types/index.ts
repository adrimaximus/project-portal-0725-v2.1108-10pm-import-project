// This is a placeholder for a full types file.
// In a real scenario, you would have more types here.

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  // other task properties
}

export interface Person {
  id: string;
  full_name: string;
  email?: string;
  company?: string | null;
  company_id?: string | null;
  // other person properties
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  payment_status: string;
  budget?: number;
  start_date?: string;
  due_date?: string;
  venue?: string;
  services?: string[];
  tasks?: Task[];
  people?: Person[];
  person_ids?: string[];
  // other project properties
}

export const PROJECT_STATUS_OPTIONS = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'Requested', label: 'Requested' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const PAYMENT_STATUS_OPTIONS = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Proposed', label: 'Proposed' },
    { value: 'Cancelled', label: 'Cancelled' },
];