import { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
import { PaymentStatus, Project, Invoice, Member, Owner } from "@/types";
import { isPast, subMonths, isSameMonth, startOfMonth, eachMonthOfInterval, format, addMonths, isFuture } from "date-fns";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Line } from 'recharts';

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
    // Range: 9 months back, 3 months forward
    const start = subMonths(now, 9);
    const end = addMonths(now, 3);
    const months = eachMonthOfInterval({ start: startOfMonth(start), end: endOfMonth(end) });
    
    const chartData = months.map(month => {
      // Filter invoices due in this specific month
      const dueInMonth = invoices.filter(inv => 
        inv.dueDate && isSameMonth(inv.dueDate, month)
      );

      // Partition by status
      let paid = 0;
      let overdue = 0;
      let pending = 0;

      dueInMonth.forEach(inv => {
        const amount = inv.amount || 0;
        // Check exact status or derive if overdue
        if (inv.status === 'Paid') {
          paid += amount;
        } else if (inv.status === 'Overdue') {
          overdue += amount;
        } else {
          // Generally Pending/Proposed/etc
          // Double check if it's actually overdue based on date relative to NOW (handled in invoices memo, but good to be safe)
          if (isPast(inv.dueDate) && !isSameMonth(inv.dueDate, now)) {
             // If due date is past and not current month, treat as overdue visually if not paid
             overdue += amount;
          } else {
             pending += amount;
          }
        }
      });

      const totalScheduled = paid + overdue + pending;

      return {
        name: format(month, 'MMM yyyy'),
        paid,
        overdue,
        pending,
        totalScheduled,
        isFuture: isFuture(month) && !isSameMonth(month, now)
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
            <CardTitle>Invoicing Schedule & Status</CardTitle>
            <CardDescription>
              Monthly invoiced amounts partitioned by status (Paid, Overdue, Pending). 
              Total bar height represents the total value scheduled to cash out for that month.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-lg text-sm z-50 min-w-[200px]">
                            <div className="mb-2 border-b pb-1">
                              <span className="font-bold text-base">
                                {data.name}
                              </span>
                              {data.isFuture && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">Future</span>}
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  <span className="text-muted-foreground">Paid</span>
                                </div>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(data.paid)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500" />
                                  <span className="text-muted-foreground">Overdue</span>
                                </div>
                                <span className="font-bold text-red-500">
                                  {formatCurrency(data.overdue)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                                  <span className="text-muted-foreground">Pending</span>
                                </div>
                                <span className="font-bold text-slate-600">
                                  {formatCurrency(data.pending)}
                                </span>
                              </div>
                              <div className="border-t pt-1 mt-1 flex justify-between items-center">
                                <span className="font-medium">Total Scheduled</span>
                                <span className="font-bold">
                                  {formatCurrency(data.totalScheduled)}
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
                  
                  {/* Stacked Bars */}
                  <Bar dataKey="paid" name="Paid" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="overdue" name="Overdue" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  
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