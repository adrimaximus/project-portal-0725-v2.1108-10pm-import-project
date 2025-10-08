import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExtendedProject, Invoice, PaymentStatus } from '@/types';
import { DataTable } from '@/components/billing/DataTable';
import { getColumns } from '@/components/billing/Columns';
import { BillingSummary } from '@/components/billing/BillingSummary';
import BillingToolbar from '@/components/billing/BillingToolbar';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Billing = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');

  const { data: projects = [], isLoading, error } = useQuery<ExtendedProject[]>({
    queryKey: ['dashboardProjects'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_projects', {
        p_limit: 1000, 
        p_offset: 0,
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const invoices: Invoice[] = useMemo(() => projects
    .map(project => {
        if (!project.payment_due_date) return null;

        return {
            id: project.id,
            projectId: project.slug,
            projectName: project.name,
            amount: project.budget || 0,
            dueDate: new Date(project.payment_due_date),
            status: project.payment_status,
            rawProjectId: project.id,
            projectStartDate: project.start_date ? new Date(project.start_date) : null,
            projectEndDate: project.due_date ? new Date(project.due_date) : null,
            poNumber: project.po_number || null,
            paidDate: project.paid_date ? new Date(project.paid_date) : null,
            emailSendingDate: project.email_sending_date ? new Date(project.email_sending_date) : null,
            hardcopySendingDate: project.hardcopy_sending_date ? new Date(project.hardcopy_sending_date) : null,
            channel: project.channel || null,
            clientName: project.client_name || null,
            clientLogo: project.client_company_logo_url || null,
            clientCompanyName: project.client_company_name || null,
            projectOwner: project.created_by,
            assignedMembers: project.assignedTo,
            invoiceAttachments: project.invoice_attachments || [],
            clientCompanyCustomProperties: project.client_company_custom_properties || null,
        };
    })
    .filter((invoice): invoice is Invoice => invoice !== null), [projects]);

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') {
      return invoices;
    }
    return invoices.filter(invoice => invoice.status === statusFilter);
  }, [invoices, statusFilter]);

  const handleUpdateInvoice = async (invoiceId: string, updates: Partial<Invoice>) => {
    try {
      const projectUpdates: Partial<ExtendedProject> = {};
      if (updates.status) projectUpdates.payment_status = updates.status;
      if (updates.dueDate && updates.dueDate instanceof Date) projectUpdates.payment_due_date = updates.dueDate.toISOString();
      if (updates.poNumber) projectUpdates.po_number = updates.poNumber;
      if (updates.paidDate && updates.paidDate instanceof Date) projectUpdates.paid_date = updates.paidDate.toISOString();
      if (updates.emailSendingDate && updates.emailSendingDate instanceof Date) projectUpdates.email_sending_date = updates.emailSendingDate.toISOString();
      if (updates.hardcopySendingDate && updates.hardcopySendingDate instanceof Date) projectUpdates.hardcopy_sending_date = updates.hardcopySendingDate.toISOString();
      if (updates.channel) projectUpdates.channel = updates.channel;

      const { error } = await supabase
        .from('projects')
        .update(projectUpdates)
        .eq('id', invoiceId);

      if (error) throw error;
      toast.success('Invoice updated successfully');
      // Invalidate queries to refetch data
    } catch (error: any) {
      toast.error('Failed to update invoice', { description: error.message });
    }
  };

  const columns = getColumns({ onUpdate: handleUpdateInvoice, currentUser: user });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading billing data: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Billing</h1>
      <BillingSummary invoices={invoices} />
      <div className="bg-card p-4 rounded-lg shadow-sm">
        <BillingToolbar statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />
        <DataTable columns={columns} data={filteredInvoices} />
      </div>
    </div>
  );
};

export default Billing;