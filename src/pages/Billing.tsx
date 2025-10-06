import { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import { PaymentStatus, Project } from "@/types";
import { cn, getPaymentStatusStyles } from "@/lib/utils";
import { format, addDays, isPast } from "date-fns";
import { DollarSign, Clock, AlertTriangle, Download, Loader2, MoreVertical, Edit, ArrowUp, ArrowDown, Search, Kanban, Table as TableIcon, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditInvoiceDialog } from "@/components/billing/EditInvoiceDialog";
import { useProjectMutations } from "@/hooks/useProjectMutations";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import BillingKanbanView from "@/components/billing/BillingKanbanView";

type Member = {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
  email: string;
  role: string;
};

type Owner = {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
  email: string;
};

export type Invoice = {
  id: string;
  projectId: string; // slug
  projectName: string;
  amount: number;
  dueDate: Date; // This is the payment due date
  status: PaymentStatus;
  rawProjectId: string; // original uuid
  projectStartDate: Date | null;
  projectEndDate: Date | null;
  poNumber: string | null;
  paidDate: Date | null;
  emailSendingDate: Date | null;
  hardcopySendingDate: Date | null;
  channel: string | null;
  clientName: string | null;
  clientLogo: string | null;
  clientCompanyName: string | null;
  projectOwner: Owner | null;
  assignedMembers: Member[];
};

interface ExtendedProject extends Project {
  client_name?: string | null;
  client_company_logo_url?: string | null;
  client_company_name?: string | null;
}

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

  const invoices: Invoice[] = (projects as ExtendedProject[])
    .map(project => {
      if (!project.payment_status || !project.budget || !project.due_date) {
        return null;
      }
      
      const dueDate = addDays(new Date(project.due_date), 30);

      let finalStatus = project.payment_status;
      if (['Unpaid', 'Pending', 'In Process'].includes(finalStatus) && isPast(dueDate)) {
        finalStatus = 'Overdue';
      }

      return {
        id: project.invoice_number || `INV-${project.id.substring(0, 8).toUpperCase()}`,
        projectId: project.slug,
        projectName: project.name,
        amount: project.budget,
        dueDate: dueDate,
        status: finalStatus as PaymentStatus,
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
        assignedMembers: project.assignedTo || [],
      };
    })
    .filter((invoice): invoice is Invoice => invoice !== null);

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
          return true; // No date filter applied
        }

        if (!invoice.projectStartDate) {
          return false; // Invoice's project has no start date, cannot match a date filter
        }

        const filterStart = dateRange.from;
        const filterEnd = dateRange.to || dateRange.from; // Handle single day selection

        const projectStart = invoice.projectStartDate;
        const projectEnd = invoice.projectEndDate || projectStart;

        // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
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
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'projectOwner':
          aValue = a.projectOwner?.name;
          bValue = b.projectOwner?.name;
          break;
        case 'assignedMembers':
          aValue = a.assignedMembers?.find(m => m.role === 'admin')?.name;
          bValue = b.assignedMembers?.find(m => m.role === 'admin')?.name;
          break;
        default:
          aValue = a[sortColumn];
          bValue = b[sortColumn];
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredInvoices, sortColumn, sortDirection]);

  const outstandingBalance = filteredInvoices
    .filter(inv => ['Due', 'Overdue', 'Unpaid', 'Pending', 'In Process'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);

  const nextDueDate = filteredInvoices
    .filter(inv => ['Due', 'Unpaid', 'Pending', 'In Process'].includes(inv.status))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]?.dueDate;

  const overdueInvoicesCount = filteredInvoices.filter(inv => inv.status === 'Overdue').length;

  const projectAdmins = useMemo(() => {
    const adminMap = new Map<string, { admin: Member; projectCount: number }>();
    invoices.forEach(invoice => {
        invoice.assignedMembers
            .filter(member => member.role === 'admin')
            .forEach(admin => {
                if (adminMap.has(admin.id)) {
                    adminMap.get(admin.id)!.projectCount++;
                } else {
                    adminMap.set(admin.id, { admin, projectCount: 1 });
                }
            });
    });
    return Array.from(adminMap.values()).sort((a, b) => b.projectCount - a.projectCount);
  }, [invoices]);

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

  const renderSortIcon = (column: keyof Invoice) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
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

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice #, project, client, PO #, or channel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{'Rp ' + outstandingBalance.toLocaleString('id-ID')}</div>
              <p className="text-xs text-muted-foreground">Total amount due</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Payment Due</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {nextDueDate ? format(nextDueDate, 'MMM dd, yyyy') : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Date of next invoice payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueInvoicesCount}</div>
              <p className="text-xs text-muted-foreground">Invoices past their due date</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-24 overflow-y-auto pr-2">
                {projectAdmins.length > 0 ? projectAdmins.map(({ admin, projectCount }) => (
                  <div key={admin.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={admin.avatar_url} alt={admin.name} />
                        <AvatarFallback>{admin.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{admin.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground flex-shrink-0">{projectCount} project{projectCount > 1 ? 's' : ''}</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center pt-4">No project admins found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Invoice History</CardTitle>
              <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) setViewMode(value as 'table' | 'kanban')}}>
                  <ToggleGroupItem value="table" aria-label="Table view"><TableIcon className="h-4 w-4" /></ToggleGroupItem>
                  <ToggleGroupItem value="kanban" aria-label="Kanban view"><Kanban className="h-4 w-4" /></ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {viewMode === 'table' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('id')} className="px-2">
                        Invoice # {renderSortIcon('id')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('projectName')} className="px-2">
                        Project {renderSortIcon('projectName')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('clientName')} className="px-2">
                        Client {renderSortIcon('clientName')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('projectOwner')} className="px-2">
                        Owner {renderSortIcon('projectOwner')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('assignedMembers')} className="px-2">
                        Project Admin {renderSortIcon('assignedMembers')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('status')} className="px-2">
                        Status {renderSortIcon('status')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('poNumber')} className="px-2">
                        PO # {renderSortIcon('poNumber')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('amount')} className="px-2">
                        Amount {renderSortIcon('amount')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('dueDate')} className="px-2">
                        Due Date {renderSortIcon('dueDate')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>
                          <Link to={`/projects/${invoice.projectId}`} className="font-medium text-primary hover:underline">
                            {invoice.projectName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={invoice.clientLogo || undefined} alt={invoice.clientName || ''} />
                              <AvatarFallback>{invoice.clientName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{invoice.clientName || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{invoice.clientCompanyName || ''}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.projectOwner && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={invoice.projectOwner.avatar_url} alt={invoice.projectOwner.name} />
                                    <AvatarFallback>{invoice.projectOwner.initials}</AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{invoice.projectOwner.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex -space-x-2 overflow-hidden">
                            {invoice.assignedMembers
                              .filter(member => member.role === 'admin')
                              .map(admin => (
                                <TooltipProvider key={admin.id}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-8 w-8 border-2 border-background">
                                        <AvatarImage src={admin.avatar_url} alt={admin.name} />
                                        <AvatarFallback>{admin.initials}</AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{admin.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("border-transparent", getPaymentStatusStyles(invoice.status).tw)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{invoice.poNumber || 'N/A'}</TableCell>
                        <TableCell>{'Rp ' + invoice.amount.toLocaleString('id-ID')}</TableCell>
                        <TableCell>{format(invoice.dueDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleEdit(invoice)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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