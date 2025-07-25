export type Collaborator = {
  id: string;
  name: string;
  src: string;
  fallback: string;
  online: boolean;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed' | 'In Progress' | 'On Hold';
  team: { name: string; src: string; fallback: string }[];
  assignedTo?: { name: string; src: string; fallback: string };
  progress: number;
  lastUpdated: string;
  budget?: number;
  deadline?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Overdue';
  paymentDueDate?: string;
  invoiceAttachmentUrl?: string | null;
  tickets?: { open: number; total: number };
};