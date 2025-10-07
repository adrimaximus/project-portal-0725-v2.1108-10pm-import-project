import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { getPaymentStatusStyles, cn } from '@/lib/utils';
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  FileText,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  projectName: string;
  projectSlug: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: string;
  paidDate?: string;
  emailSentDate?: string;
  hardcopySentDate?: string;
};

const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, slug, budget, payment_due_date, payment_status, paid_date, email_sending_date, hardcopy_sending_date, invoice_number, po_number, client_name:people(full_name)')
        .returns<any[]>();

      if (error) throw error;

      return data.map((p: any): Invoice => ({
        id: p.id,
        invoiceNumber: p.invoice_number || `INV-${p.id.substring(0, 5)}`,
        projectName: p.name,
        projectSlug: p.slug,
        clientName: Array.isArray(p.client_name) ? p.client_name[0]?.full_name || 'N/A' : p.client_name?.full_name || 'N/A',
        amount: p.budget || 0,
        dueDate: p.payment_due_date,
        status: p.payment_status,
        paidDate: p.paid_date,
        emailSentDate: p.email_sending_date,
        hardcopySentDate: p.hardcopy_sending_date,
      }));
    },
  });
};

const BillingPage = () => {
  const { data: invoices = [], isLoading } = useInvoices();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Invoice; direction: 'ascending' | 'descending' } | null>({ key: 'dueDate', direction: 'descending' });
  const [copied, setCopied] = useState<string | null>(null);

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [invoices, searchTerm, statusFilter, sortConfig]);

  const requestSort = (key: keyof Invoice) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Invoice) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? (
      <ArrowUpDown className="ml-2 h-4 w-4" />
    ) : (
      <ArrowUpDown className="ml-2 h-4 w-4" />
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const summaryData = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    return { totalInvoices, totalAmount, paidAmount, unpaidAmount };
  }, [invoices]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Billing & Invoices</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <div className="text-sm font-bold">Rp</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat('id-ID').format(summaryData.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <div className="text-sm font-bold text-green-500">Rp</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{new Intl.NumberFormat('id-ID').format(summaryData.paidAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Amount</CardTitle>
            <div className="text-sm font-bold text-red-500">Rp</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{new Intl.NumberFormat('id-ID').format(summaryData.unpaidAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle>All Invoices</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[250px]"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => requestSort('invoiceNumber')}>
                  <div className="flex items-center cursor-pointer">
                    Invoice
                    {getSortIcon('invoiceNumber')}
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort('projectName')}>
                  <div className="flex items-center cursor-pointer">
                    Project
                    {getSortIcon('projectName')}
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort('clientName')}>
                  <div className="flex items-center cursor-pointer">
                    Client
                    {getSortIcon('clientName')}
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort('amount')}>
                  <div className="flex items-center cursor-pointer">
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort('dueDate')}>
                  <div className="flex items-center cursor-pointer">
                    Due Date
                    {getSortIcon('dueDate')}
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort('status')}>
                  <div className="flex items-center cursor-pointer">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {invoice.invoiceNumber}
                      <Button variant="ghost" size="icon" className="ml-2 h-6 w-6" onClick={() => handleCopy(invoice.invoiceNumber)}>
                        {copied === invoice.invoiceNumber ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{invoice.projectName}</TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>Rp{new Intl.NumberFormat('id-ID').format(invoice.amount)}</TableCell>
                  <TableCell>{invoice.dueDate ? format(new Date(invoice.dueDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border-transparent", getPaymentStatusStyles(invoice.status).className)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          <span>View Invoice</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          <span>Send Reminder</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingPage;