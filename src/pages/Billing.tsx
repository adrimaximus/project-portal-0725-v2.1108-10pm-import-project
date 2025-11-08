import { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatus, Project, Invoice, Member, Owner } from "@/types";
import { isPast } from "date-fns";
import { Loader2 } from "lucide-react";
import { EditInvoiceDialog } from "@/components/billing/EditInvoiceDialog";
import BillingStats from "@/components/billing/BillingStats";
import BillingToolbar from "@/components/billing/BillingToolbar";
import BillingTable from "@/components/billing/BillingTable";
import BillingKanbanView from "@/components/billing/BillingKanbanView";
import { DateRange } from "react-day-picker";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const fetchInvoices = async (): Promise<Invoice[]> => {
  const { data, error } = await supabase.rpc('get_all_invoices');
  if (error) throw error;
  return data.map((d: any) => ({
    ...d,
    dueDate: d.payment_due_date ? new Date(d.payment_due_date) : null,
    rawProjectId: d.project_id,
    projectId: d.project_slug,
  })) as Invoice[];
};

const Billing = () => {
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  });
  const { data: projectsData = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*');
      if (error) throw error;
      return data;
    }
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Invoice>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const queryClient = useQueryClient();

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ projectId, newStatus }: { projectId: string, newStatus: PaymentStatus }) => {
        const { error } = await supabase
            .from('projects')
            .update({ payment_status: newStatus })
            .eq('id', projectId);
        if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment status updated.");
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err: any) => {
        toast.error("Failed to update payment status.", { description: err.message });
    },
  });

  const handleStatusChange = (projectId: string, newStatus: PaymentStatus) => {
      updatePaymentStatusMutation.mutate({ projectId, newStatus });
  };
  
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

  const { activeInvoices, archivedInvoices } = useMemo(() => {
    const active: Invoice[] = [];
    const archived: Invoice[] = [];
    const archivedStatuses: PaymentStatus[] = ['Paid', 'Cancelled', 'Bid Lost'];

    filteredInvoices.forEach(invoice => {
      if (archivedStatuses.includes(invoice.status)) {
        archived.push(invoice);
      } else {
        active.push(invoice);
      }
    });

    return { activeInvoices: active, archivedInvoices: archived };
  }, [filteredInvoices]);

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
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
            <CardTitle>Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {viewMode === 'table' ? (
              <BillingTable
                invoices={activeInvoices}
                onEdit={handleEdit}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                handleSort={handleSort}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <BillingKanbanView invoices={activeInvoices} onEditInvoice={handleEdit} />
            )}
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <h2 className="text-lg font-semibold">Archived Invoices ({archivedInvoices.length})</h2>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="p-0">
                  {viewMode === 'table' ? (
                    <BillingTable
                      invoices={archivedInvoices}
                      onEdit={handleEdit}
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      handleSort={handleSort}
                      onStatusChange={handleStatusChange}
                    />
                  ) : (
                    <BillingKanbanView invoices={archivedInvoices} onEditInvoice={handleEdit} />
                  )}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <EditInvoiceDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        invoice={selectedInvoice}
        project={projectsData.find(p => p.id === selectedInvoice?.rawProjectId) || null}
      />
    </PortalLayout>
  );
};

export default Billing;