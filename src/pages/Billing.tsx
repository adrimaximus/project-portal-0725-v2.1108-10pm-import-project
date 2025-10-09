import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExtendedProject, Invoice, Project } from '@/types';
import { toast } from 'sonner';
import { BillingHeader } from '@/components/billing/BillingHeader';
import BillingTable from '@/components/billing/BillingTable';
import { EditInvoiceDialog } from '@/components/billing/EditInvoiceDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { Loader2 } from 'lucide-react';

const BillingPage = () => {
  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [sortColumn, setSortColumn] = useState<keyof Invoice>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_dashboard_projects', {
      p_limit: 1000, // Fetch all for now
      p_offset: 0,
      p_search_term: debouncedSearchTerm || null,
    });

    if (error) {
      setError('Failed to fetch projects: ' + error.message);
      toast.error('Failed to fetch projects', { description: error.message });
      setProjects([]);
    } else {
      setProjects(data as ExtendedProject[]);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [debouncedSearchTerm]);

  const invoices = useMemo((): Invoice[] => {
    return projects.map(p => ({
      id: p.invoice_number || p.id,
      projectId: p.slug,
      projectName: p.name,
      amount: p.budget || 0,
      dueDate: p.payment_due_date ? new Date(p.payment_due_date) : new Date(),
      status: p.payment_status || 'Unpaid',
      rawProjectId: p.id,
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
      invoiceAttachments: p.invoice_attachments || [],
    }));
  }, [projects]);

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      let compare = 0;
      if (aVal === null || aVal === undefined) compare = -1;
      else if (bVal === null || bVal === undefined) compare = 1;
      else if (aVal < bVal) compare = -1;
      else if (aVal > bVal) compare = 1;

      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [invoices, sortColumn, sortDirection]);

  const handleSort = (column: keyof Invoice) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleEdit = (invoice: Invoice) => {
    const project = projects.find(p => p.id === invoice.rawProjectId);
    if (project) {
      setSelectedInvoice(invoice);
      setSelectedProject(project);
      setIsEditDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedInvoice(null);
    setSelectedProject(null);
  };

  const handleSave = async (updatedProjectData: Partial<Project> & { id: string }) => {
    const { id, ...updateData } = updatedProjectData;
    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast.error('Failed to save invoice details', { description: error.message });
      throw error; // Throw error to be caught in dialog
    } else {
      await fetchProjects();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <BillingHeader 
        invoiceCount={invoices.length}
        totalAmount={invoices.reduce((sum, inv) => sum + inv.amount, 0)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : (
          <BillingTable 
            invoices={sortedInvoices} 
            onEdit={handleEdit}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
          />
        )}
      </div>
      <EditInvoiceDialog
        isOpen={isEditDialogOpen}
        onClose={handleCloseDialog}
        invoice={selectedInvoice}
        project={selectedProject}
        onSave={handleSave}
      />
    </div>
  );
};

export default BillingPage;