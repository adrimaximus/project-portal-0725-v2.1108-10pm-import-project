import { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatus, Project, Invoice, Member, Owner, Company } from "@/types";
import { isPast } from "date-fns";
import { Loader2 } from "lucide-react";
import { ManageBillingDialog } from "@/components/billing/ManageBillingDialog";
import BillingStats from "@/components/billing/BillingStats";
import BillingToolbar from "@/components/billing/BillingToolbar";
import BillingTable from "@/components/billing/BillingTable";
import BillingKanbanView from "@/components/billing/BillingKanbanView";
import { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useInvoices = () => {
  return useQuery<Invoice[], Error>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_invoices');
      if (error) throw error;

      return data.map((d: any) => ({
        id: d.id,
        invoice_number: d.invoice_number,
        projectName: d.project_name,
        projectId: d.project_slug,
        rawProjectId: d.project_id,
        amount: d.amount,
        dueDate: new Date(d.payment_due_date),
        status: d.payment_status,
        projectStartDate: d.project_start_date ? new Date(d.project_start_date) : null,
        projectEndDate: d.project_end_date ? new Date(d.project_end_date) : null,
        poNumber: d.po_number,
        paidDate: d.paid_date ? new Date(d.paid_date) : null,
        emailSendingDate: d.email_sending_date ? new Date(d.email_sending_date) : null,
        hardcopySendingDate: d.hardcopy_sending_date ? new Date(d.hardcopy_sending_date) : null,
        channel: d.channel,
        clientName: d.client_company_name,
        clientAvatarUrl: null, // This info is not in company table, might need to join with people
        clientLogo: d.client_company_logo_url,
        clientCompanyName: d.client_company_name,
        projectOwner: d.project_owner,
        assignedMembers: d.assigned_members || [],
        invoiceAttachments: d.invoice_attachments || [],
        payment_terms: d.payment_terms || [],
      }));
    }
  });
};

const Billing = () => {
  const { data: invoices = [], isLoading } = useInvoices();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Invoice>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(searchTermLower)) ||
        invoice.projectName.toLowerCase().includes(searchTermLower) ||
        (invoice.clientName && invoice.clientName.toLowerCase().includes(searchTermLower)) ||
        (invoice.poNumber && invoice.poNumber.toLowerCase().includes(searchTermLower)) ||
        (invoice.channel && invoice.channel.toLowerCase().includes(searchTermLower));

      const matchesDate = (() => {
        if (!dateRange || !dateRange.from) return true;
        if (!invoice.projectStartDate) return false;
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

  const handleEdit = async (invoice: Invoice) => {
    const { data, error } = await supabase.from('projects').select('*').eq('id', invoice.rawProjectId).single();
    if (error) {
      toast.error("Could not load project details to edit billing.");
      return;
    }
    setSelectedProject(data as Project);
    setIsFormOpen(true);
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
            View your invoices and manage your payment details.
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
                invoices={filteredInvoices}
                onEdit={handleEdit}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                handleSort={handleSort}
              />
            ) : (
              <BillingKanbanView invoices={filteredInvoices} onEditInvoice={handleEdit} />
            )}
          </CardContent>
        </Card>
      </div>
      <ManageBillingDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        project={selectedProject}
      />
    </PortalLayout>
  );
};

export default Billing;