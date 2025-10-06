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
import { DollarSign, Clock, AlertTriangle, Download, Loader2, MoreVertical, Edit, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditInvoiceDialog } from "@/components/billing/EditInvoiceDialog";
import { useProjectMutations } from "@/hooks/useProjectMutations";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";

type Invoice = {
  id: string;
  projectId: string; // slug
  projectName: string;
  amount: number;
  dueDate: Date; // This is the payment due date
  status: PaymentStatus;
  rawProjectId: string; // original uuid
  projectStartDate: Date | null;
  projectEndDate: Date | null;
};

const Billing = () => {
  const { data: projects = [], isLoading } = useProjects();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Invoice>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { updateProject } = useProjectMutations(selectedInvoice?.projectId || '');

  const invoices: Invoice[] = projects
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
      };
    })
    .filter((invoice): invoice is Invoice => invoice !== null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        invoice.id.toLowerCase().includes(searchTermLower) ||
        invoice.projectName.toLowerCase().includes(searchTermLower);

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
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

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
              placeholder="Search by invoice # or project name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('id')} className="flex items-center">
                      Invoice # {renderSortIcon('id')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('projectName')} className="flex items-center">
                      Project {renderSortIcon('projectName')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('amount')} className="flex items-center">
                      Amount {renderSortIcon('amount')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('dueDate')} className="flex items-center">
                      Due Date {renderSortIcon('dueDate')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('status')} className="flex items-center">
                      Status {renderSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
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
                      <TableCell>{'Rp ' + invoice.amount.toLocaleString('id-ID')}</TableCell>
                      <TableCell>{format(invoice.dueDate, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("border-transparent", getPaymentStatusStyles(invoice.status).tw)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
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