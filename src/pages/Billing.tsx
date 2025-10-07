import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import { EditInvoiceDialog } from '@/components/billing/EditInvoiceDialog';
import BillingTable from '@/components/billing/BillingTable';
import { Invoice, Project, ExtendedProject } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const fetchProjectsForBilling = async (): Promise<ExtendedProject[]> => {
  const { data, error } = await supabase
    .rpc('get_dashboard_projects', { p_limit: 1000, p_offset: 0 });

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error(error.message);
  }
  return data || [];
};

const BillingPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Invoice>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: projects = [], isLoading, error } = useQuery<ExtendedProject[]>({
    queryKey: ['projectsForBilling'],
    queryFn: fetchProjectsForBilling,
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (updatedProjectData: Partial<Project> & { id: string }) => {
      const { error } = await supabase
        .from('projects')
        .update(updatedProjectData)
        .eq('id', updatedProjectData.id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success('Invoice updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['projectsForBilling'] });
    },
    onError: (error) => {
      toast.error('Failed to update invoice', {
        description: error.message,
      });
    },
  });

  const invoices: Invoice[] = useMemo(() => {
    if (!projects) return [];
    return projects
      .filter(p => p.payment_status !== 'Proposed')
      .map(p => ({
        id: p.invoice_number || p.id,
        rawProjectId: p.id,
        projectId: p.slug,
        projectName: p.name,
        amount: p.budget || 0,
        dueDate: new Date(p.payment_due_date || p.due_date || Date.now()),
        status: p.payment_status,
        projectStartDate: p.start_date ? new Date(p.start_date) : null,
        projectEndDate: p.due_date ? new Date(p.due_date) : null,
        poNumber: p.po_number || null,
        paidDate: p.paid_date ? new Date(p.paid_date) : null,
        emailSendingDate: p.email_sending_date ? new Date(p.email_sending_date) : null,
        hardcopySendingDate: p.hardcopy_sending_date ? new Date(p.hardcopy_sending_date) : null,
        channel: p.channel || null,
        clientName: p.client_name || null,
        clientLogo: p.client_company_logo_url || null,
        clientCompanyName: p.client_company_name || null,
        projectOwner: p.created_by,
        assignedMembers: p.assignedTo,
        invoiceAttachmentUrl: p.invoice_attachment_url,
        invoiceAttachmentName: p.invoice_attachment_name,
      }));
  }, [projects]);

  const handleEdit = (invoice: Invoice) => {
    const projectForInvoice = projects.find(p => p.id === invoice.rawProjectId);
    if (projectForInvoice) {
      setSelectedInvoice(invoice);
      setSelectedProject(projectForInvoice);
      setIsEditDialogOpen(true);
    } else {
      toast.error("Could not find the associated project for this invoice.");
    }
  };

  const handleSave = (updatedProjectData: Partial<Project> & { id: string }) => {
    updateProjectMutation.mutate(updatedProjectData);
  };

  const handleSort = (column: keyof Invoice) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice =>
      invoice.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.clientName && invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (typeof aValue === 'object' && aValue !== null && 'name' in aValue &&
                 typeof bValue === 'object' && bValue !== null && 'name' in bValue) {
        comparison = (aValue as {name:string}).name.localeCompare((bValue as {name:string}).name);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [invoices, searchTerm, sortColumn, sortDirection]);

  if (error) {
    return <div className="p-4 text-red-500">Error loading billing data: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage and track all your project invoices.</p>
      </header>

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invoices, projects, clients..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-12 w-full mb-2" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full mb-1" />
            ))}
          </div>
        ) : (
          <BillingTable
            invoices={filteredAndSortedInvoices}
            onEdit={handleEdit}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
          />
        )}
      </div>

      {isEditDialogOpen && selectedInvoice && selectedProject && (
        <EditInvoiceDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          invoice={selectedInvoice}
          project={selectedProject}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default BillingPage;