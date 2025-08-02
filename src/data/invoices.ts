export type InvoiceStatus = 'Paid' | 'Due' | 'Overdue' | 'Draft';

export interface Invoice {
  id: string;
  projectId: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
}

export const dummyInvoices: Invoice[] = [
  {
    id: 'INV-2024-001',
    projectId: 'proj-001',
    amount: 15000,
    dueDate: '2024-08-15',
    status: 'Paid',
  },
  {
    id: 'INV-2024-002',
    projectId: 'proj-002',
    amount: 8000,
    dueDate: '2024-09-01',
    status: 'Due',
  },
  {
    id: 'INV-2024-003',
    projectId: 'proj-003',
    amount: 5500,
    dueDate: '2024-07-20',
    status: 'Overdue',
  },
  {
    id: 'INV-2024-004',
    projectId: 'proj-004',
    amount: 22000,
    dueDate: '2024-09-10',
    status: 'Due',
  },
  {
    id: 'INV-2024-005',
    projectId: 'proj-005',
    amount: 7500,
    dueDate: '2024-06-30',
    status: 'Paid',
  },
];