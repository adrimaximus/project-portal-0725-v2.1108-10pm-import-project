import { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
import { PaymentStatus, Project, Invoice, Member, Owner } from "@/types";
import { isPast, subMonths, isSameMonth, startOfMonth, eachMonthOfInterval, format } from "date-fns";
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
import { useSortConfig } from "@/hooks/useSortConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const Billing = () => {
  const { data: projectsData, isLoading } = useProjects({ fetchAll: true });
  const projects = useMemo(() => projectsData?.pages.flatMap(page => page.projects) ?? [], [projectsData]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { sortConfig, requestSort: handleSort } = useSortConfig<keyof Invoice>({ key: 'dueDate', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const queryClient = useQueryClient();

  const { data: userProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data;
    }
  });

  const canEditStatus = useMemo(() => {
    if (!userProfile) return false;
    const role = userProfile.role?.toLowerCase() || '';
    return ['master admin', 'finance', 'admin', 'admin project'].includes(role);
  }, [userProfile]);

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ projectId, newStatus }: { projectId: string, newStatus: PaymentStatus }) => {
        const { error } = await supabase
            .from('projects')
            .update({ payment_status: newStatus })
            .eq('id', projectId);
        if (error) throw error;
    },
    onMutate: async ({ projectId, newStatus }) => {
        await queryClient.cancelQueries({ queryKey: ['projects'] });
        const previousProjects = queryClient.getQueryData<Project[]>(['projects']);
        
        queryClient.setQueryData<Project[]>(['projects'], (old) =>
            old?.map(p => p.id === projectId ? { ...p, payment_status: newStatus } : p)
        );

        return { previousProjects };
    },
    onError: (err: any, variables, context) => {
        if (context?.previousProjects) {
            queryClient.setQueryData(['projects'], context.previousProjects);
        }
        toast.error("Failed to update payment status.", { description: err.message });
    },
    onSuccess: () => {
      toast.success("Payment status updated.");
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleStatusChange = (projectId: string, newStatus: PaymentStatus) => {
      updatePaymentStatusMutation.mutate({ projectId, newStatus });
  };
  
  const invoices: Invoice[] = useMemo(() => projects
    .map((project): Invoice | null => {
      const eventDate = project.due_date || project.start_date;
      if (!project.payment_status || !project.budget || !eventDate) {
        return null;
      }
      
      const dueDate = project.payment_due_date ? new Date(project.payment_due_date) : new Date(eventDate);

      let finalStatus: PaymentStatus = project.payment_status as PaymentStatus;
      if (['Requested', 'Proposed', 'Quo Approved', 'Inv Approved', 'In Process', 'Pending', 'Partially Paid'].includes(finalStatus) && isPast(dueDate)) {
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
        payment_terms: project.payment_terms || [],
        last_billing_reminder_sent_at: project.last_billing_reminder_sent_at || null,
      } as Invoice;
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

  // Analytics Logic
  const analytics = useMemo(() => {
    const now = new Date();
    const start = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: startOfMonth(start), end: now });
    
    const chartData = months.map(month => {
      // Billed: Invoices with Due Date in this month
      const billedInMonth = invoices.filter(inv => 
        inv.dueDate && isSameMonth(inv.dueDate, month)
      );
      const billed = billedInMonth.reduce((sum, inv) => sum + (inv.amount || 0), 0);

      // Collected: Invoices with Paid Date in this month and status is Paid
      const paidInMonth = invoices.filter(inv => 
        inv.paidDate && isSameMonth(inv.paidDate, month) && inv.status === 'Paid'
      );
      const collected = paidInMonth.reduce((sum, inv) => sum + (inv.amount || 0), 0);

      return {
        name: format(month, 'MMM yyyy'),
        billed,
        collected
      };
    });

    return { chartData };
  }, [invoices]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

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
      <div className="space-y-6 pb-20">
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

        {/* Analytics Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Analytics</CardTitle>
            <CardDescription>Monthly Billed (Due) vs Collected (Paid) amounts.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => new Intl.NumberFormat("id-ID", { notation: "compact", compactDisplay: "short" }).format(value)}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              <div className="col-span-2 mb-1">
                                <span className="text-[0.70rem] uppercase text-muted-foreground font-bold">
                                  {payload[0].payload.name}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Billed
                                </span>
                                <span className="font-bold text-primary">
                                  {formatCurrency(payload[0].value as number)}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Collected
                                </span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(payload[1].value as number)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="billed" name="Invoiced" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary/50" maxBarSize={40} />
                  <Bar dataKey="collected" name="Collected" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-green-500" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {viewMode === 'table' ? (
              <BillingTable
                invoices={activeInvoices}
                onEdit={handleEdit}
                sortConfig={sortConfig}
                handleSort={handleSort}
                onStatusChange={canEditStatus ? handleStatusChange : undefined}
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
                      sortConfig={sortConfig}
                      handleSort={handleSort}
                      onStatusChange={canEditStatus ? handleStatusChange : undefined}
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
        project={projects.find(p => p.id === selectedInvoice?.rawProjectId) || null}
      />
    </PortalLayout>
  );
};

export default Billing;