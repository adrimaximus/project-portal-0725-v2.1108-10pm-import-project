import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExtendedProject, Invoice } from '@/types';
import { DataTable } from '@/components/billing/DataTable';
import { getColumns } from '@/components/billing/Columns';
import { BillingSummary } from '@/components/billing/BillingSummary';
import BillingToolbar from '@/components/billing/BillingToolbar';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PortalLayout from '@/components/layout/PortalLayout';

const Billing = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

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
            id: project.invoice_number || `INV-${project.id.substring(0, 8).toUpperCase()}`,
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
    if (!searchTerm) {
      return invoices;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return invoices.filter(invoice => {
      return (
        invoice.id.toLowerCase().includes(lowercasedFilter) ||
        invoice.projectName.toLowerCase().includes(lowercasedFilter) ||
        (invoice.clientName && invoice.clientName.toLowerCase().includes(lowercasedFilter)) ||
        (invoice.poNumber && invoice.poNumber.toLowerCase().includes(lowercasedFilter)) ||
        (invoice.channel && invoice.channel.toLowerCase().includes(lowercasedFilter))
      );
    });
  }, [invoices, searchTerm]);

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceId, updates }: { invoiceId: string, updates: Partial<Invoice> }) => {
      const projectUpdates: Partial<ExtendedProject> = {};
      if (updates.status) projectUpdates.payment_status = updates.status;
      if (updates.poNumber) projectUpdates.po_number = updates.poNumber;
      if (updates.paidDate) projectUpdates.paid_date = (updates.paidDate as Date).toISOString();
      if (updates.emailSendingDate) projectUpdates.email_sending_date = (updates.emailSendingDate as Date).toISOString();
      if (updates.hardcopySendingDate) projectUpdates.hardcopy_sending_date = (updates.hardcopySendingDate as Date).toISOString();
      if (updates.channel) projectUpdates.channel = updates.channel;

      const { error } = await supabase
        .from('projects')
        .update(projectUpdates)
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Invoice updated successfully');
      queryClient.invalidateQueries({ queryKey: ['dashboardProjects'] });
    },
    onError: (error: any) => {
      toast.error('Failed to update invoice', { description: error.message });
    }
  });

  const handleUpdateInvoice = (invoiceId: string, updates: Partial<Invoice>) => {
    updateInvoiceMutation.mutate({ invoiceId, updates });
  };

  const columns = getColumns({ onUpdate: handleUpdateInvoice, currentUser: user });

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="text-red-500 p-4">Error loading billing data: {error.message}</div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            View your invoices and manage your payment details, derived from your projects.
          </p>
        </div>
        
        <BillingToolbar 
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />

        <BillingSummary invoices={invoices} projects={projects} />

        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={columns} data={filteredInvoices} />
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Billing;