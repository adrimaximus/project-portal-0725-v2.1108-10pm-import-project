export type InvoiceStatus = 'Paid' | 'Due' | 'Overdue' | 'Draft';

export interface Invoice {
  id: string;
  project: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
}

export const dummyInvoices: Invoice[] = [
  {
    id: 'INV-2024-001',
    project: 'E-commerce Platform',
    amount: 15000,
    dueDate: '2024-08-15',
    status: 'Paid',
  },
  {
    id: 'INV-2024-002',
    project: 'Mobile App Redesign',
    amount: 8000,
    dueDate: '2024-09-01',
    status: 'Due',
  },
  {
    id: 'INV-2024-003',
    project: 'Q3 Marketing Campaign',
    amount: 5500,
    dueDate: '2024-07-20',
    status: 'Overdue',
  },
  {
    id: 'INV-2024-004',
    project: 'Data Analytics Dashboard',
    amount: 22000,
    dueDate: '2024-09-10',
    status: 'Due',
  },
  {
    id: 'INV-2024-005',
    project: 'Brand Identity Refresh',
    amount: 7500,
    dueDate: '2024-06-30',
    status: 'Paid',
  },
];