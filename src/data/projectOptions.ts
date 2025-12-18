export type ProjectStatus = 'Requested' | 'Proposed' | 'Quo Approved' | 'In Process' | 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Cancelled' | 'Bid Lost';
export type PaymentStatus = 'Proposed' | 'Unpaid' | 'Pending' | 'Partially Paid' | 'In Process' | 'Overdue' | 'Paid' | 'Cancelled';
export type TaskPriority = 'Urgent' | 'High' | 'Normal' | 'Low';
export type TaskStatus = 'To do' | 'In progress' | 'In review' | 'Done';

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'Requested', label: 'Requested' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Quo Approved', label: 'Quotation Approved' },
  { value: 'In Process', label: 'In Process' },
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
];

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To do', label: 'To Do' },
  { value: 'In progress', label: 'In Progress' },
  { value: 'In review', label: 'In Review' },
  { value: 'Done', label: 'Done' },
];