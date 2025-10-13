import { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
import { PaymentStatus, Project, Invoice, ExtendedProject, Member, Owner } from "@/types";
import { isPast } from "date-fns";
import { Loader2 } from "lucide-react";
import { EditInvoiceDialog } from "@/components/billing/EditInvoiceDialog";
import { useProjectMutations } from "@/hooks/useProjectMutations";
import BillingStats from "@/components/billing/BillingStats";
import BillingToolbar from "@/components/billing/BillingToolbar";
import BillingTable from "@/components/billing/BillingTable";
import BillingKanbanView from "@/components/billing/BillingKanbanView";
import { DateRange } from "react-day-picker";

const Billing = () => {
  const { data: projects = [], isLoading } = useProjects();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Invoice>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  const { updateProject } = useProjectMutations(selectedInvoice?.projectId || '');

  const invoices: Invoice[] = useMemo(() => (projects as ExtendedProject[])
    .map(project => {
      const eventDate = project.due_date || project.start_date;
      if (!project.payment_status || !project.budget || !eventDate) {
        return null;
      }
      
      const dueDate = project.payment_due_date ? new Date(project.payment_due_date) : new Date(eventDate);

      let finalStatus: PaymentStatus = project.payment_status;
      if (['Unpaid', 'Pending', 'In Process'].includes(finalStatus) && isPast(dueDate)) {
        finalStatus = 'Overdue';
      }

      return {
        id: project.invoice_number || `INV-${project.id.substring(0, 8).toUpperCase()}`,
        projectId: project.slug,
        projectName: project.name,
        amount: project.budget,
        dueDate: dueDate,
        status: finalStatus,
        rawProjectId: project.id,
        projectStartDate: project.start_date ? new Date(project.start_date) : null,
        projectEndDate: project.due_date ? new Date(project.due_date) : null,
        poNumber: project.po_number || null,
        paidDate: project.paid_date ? new Date(project.paid_date) : null,
        emailSendingDate: project.email_sending_date ? new Date(project.email_sending_date) : null,
        hardcopySendingDate: project.hardcopy_sending_date ? new Date(project.hardcopy_sending_date) : null,
        channel: project.channel || null,
        clientName: project.client_name || null,
        clientAvatarUrl: project.client_avatar_url || null,
        clientLogo: project.client_company_logo_url || null,
        clientCompanyName: project.client_company_name || null,
        projectOwner: project.created_by as Owner | null,
        assignedMembers: (project.assignedTo as Member[]) || [],
        invoiceAttachments: project.invoice_attachments || [],
      };
    })
    .filter((invoice): invoice is Invoice => invoice !== null), [projects]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        invoice.id.toLowerCase().includes(searchTermLower) ||
        invoice.projectName.toLowerCase().includes(searchTermLower) ||
        (invoice.clientName && invoice.clientName.toLowerCase().includes(searchTermLower)) ||
        (invoice.poNumber && invoice.poNumber.toLowerCase().includes(searchTermLower)) ||
        (invoice.channel && invoice.channel.toLowerCase().includes(searchTermLower));

      const matchesDate = (() => {
        if (!dateRange || !dateRange.from) {
          return true;
        }
        if (!invoice.projectStartDate) {
          return false;
        }
        const filterStart = dateRange.from;
        const filterEnd = dateRange.to || dateRange.from;
        const projectStart = invoice.projectStartDate;
        const projectEnd = invoice.projectEndDate || projectStart;
        return projectStart <= filterEnd && projectEnd >= filterStart;
      })();

      return matchesSearch && matchesDate;
    });
  }, [invoices, searchTerm, dateRange]);

  const handleSort = (column: keyof Invoice) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedInvoices = useMemo(() => {
    if (!sortColumn) return filteredInvoices;
    return [...filteredInvoices].sort((a, b) => {
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];
      if (sortColumn === 'projectOwner') {
        aValue = a.projectOwner?.name;
        bValue = b.projectOwner?.name;
      } else if (sortColumn === 'assignedMembers') {
        aValue = a.assignedMembers?.find(m => m.role === 'admin')?.name;
        bValue = b.assignedMembers?.find(m => m.role === 'admin')?.name;
      }
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [filteredInvoices, sortColumn, sortDirection]);

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleSave = (updatedProjectData: Partial<Project> & { id: string }) => {
    const originalProject = projects.find(p => p.id === updatedProjectData.id);
    if (originalProject) {
      const projectToUpdate = { ...originalProject, ...updatedProjectData };
      updateProject.mutate(projectToUpdate);
    }
  };

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            View your invoices and manage your payment details, derived from your projects.
          </p>
        </div>

        <BillingToolbar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <BillingStats invoices={filteredInvoices} />

        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {viewMode === 'table' ? (
              <BillingTable
                invoices={sortedInvoices}
                onEdit={handleEdit}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                handleSort={handleSort}
              />
            ) : (
              <BillingKanbanView invoices={sortedInvoices} onEditInvoice={handleEdit} />
            )}
          </CardContent>
        </Card>
      </div>
      <EditInvoiceDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        invoice={selectedInvoice}
        project={projects.find(p => p.id === selectedInvoice?.rawProjectId) || null}
        onSave={handleSave}
      />
    </PortalLayout>
  );
};

export default Billing;