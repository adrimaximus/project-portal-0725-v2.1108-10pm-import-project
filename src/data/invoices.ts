export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export const dummyInvoices: Invoice[] = [
  { id: 'inv-001', number: 'INV-2024-001', clientName: 'Creative Inc.', amount: 25000000, status: 'Paid' },
  { id: 'inv-002', number: 'INV-2024-002', clientName: 'Innovate LLC', amount: 42000000, status: 'Pending' },
  { id: 'inv-003', number: 'INV-2024-003', clientName: 'Tech Solutions', amount: 18000000, status: 'Overdue' },
];