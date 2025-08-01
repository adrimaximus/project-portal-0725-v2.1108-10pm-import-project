import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, isPast, differenceInDays, addDays } from "date-fns";
import { Activity, CreditCard, Wallet, CalendarDays, CalendarClock } from "lucide-react";

interface ProjectInfoCardsProps {
  project: Project;
  isEditing: boolean;
  editedProject: Project | null;
  onSelectChange: (name: 'status' | 'paymentStatus', value: string) => void;
  onDateChange: (name: 'deadline' | 'startDate', date: Date | undefined) => void;
  onBudgetChange: (value: number | undefined) => void;
}

const ProjectInfoCards = ({
  project,
  isEditing,
  editedProject,
  onSelectChange,
  onDateChange,
  onBudgetChange,
}: ProjectInfoCardsProps) => {
  const getStatusBadgeVariant = (status: Project["status"]) => {
    switch (status) {
      case "Completed":
      case "Done":
      case "Billed":
        return "default";
      case "In Progress":
        return "secondary";
      case "On Hold":
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentStatusBadgeVariant = (status: Project["paymentStatus"]) => {
    switch (status) {
      case "paid": return "default";
      case "approved":
      case "po_created":
      case "on_process":
      case "pending": 
        return "secondary";
      case "cancelled": 
        return "destructive";
      case "proposed": 
        return "outline";
      default: 
        return "outline";
    }
  };

  const formatPaymentStatus = (status: Project["paymentStatus"]) => {
    switch (status) {
      case "po_created":
        return "PO Created";
      case "on_process":
        return "On Process";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const budgetFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(project.budget || 0);

  const startDateFormatted = (project as any).startDate
    ? new Date((project as any).startDate).toLocaleDateString("en-US", {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : "Not Set";

  const deadlineFormatted = new Date(project.deadline).toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Calculate Payment Due Date as 30 days after the project deadline
  const paymentDueDate = addDays(new Date(project.deadline), 30);
  const paymentDueDateFormatted = paymentDueDate.toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const isPaymentOverdue = isPast(paymentDueDate) && !['paid', 'cancelled'].includes(project.paymentStatus);
  const paymentOverdueDays = isPaymentOverdue ? differenceInDays(new Date(), paymentDueDate) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Status</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing && editedProject ? (
            <Select value={editedProject.status} onValueChange={(value) => onSelectChange('status', value)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Requested">Requested</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Billed">Billed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={getStatusBadgeVariant(project.status)}>
              {project.status}
            </Badge>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing && editedProject ? (
            <Select value={editedProject.paymentStatus} onValueChange={(value) => onSelectChange('paymentStatus', value as Project["paymentStatus"])}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="proposed">Proposed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="po_created">PO Created</SelectItem>
                <SelectItem value="on_process">On Process</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={getPaymentStatusBadgeVariant(project.paymentStatus)}>
              {formatPaymentStatus(project.paymentStatus)}
            </Badge>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Value</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing && editedProject ? (
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">IDR</span>
              <CurrencyInput value={editedProject.budget} onChange={onBudgetChange} className="pl-12" />
            </div>
          ) : (
            <div className="text-xl font-bold">{budgetFormatted}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Start Date</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing && editedProject ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !(editedProject as any).startDate && "text-muted-foreground")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {(editedProject as any).startDate ? format(new Date((editedProject as any).startDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={(editedProject as any).startDate ? new Date((editedProject as any).startDate) : undefined} onSelect={(date) => onDateChange('startDate', date)} initialFocus />
              </PopoverContent>
            </Popover>
          ) : (
            <div className="text-xl font-bold">{startDateFormatted}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Due Date</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing && editedProject ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editedProject.deadline && "text-muted-foreground")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {editedProject.deadline ? format(new Date(editedProject.deadline), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={new Date(editedProject.deadline)} onSelect={(date) => onDateChange('deadline', date)} initialFocus />
              </PopoverContent>
            </Popover>
          ) : (
            <div>
              <div className="text-xl font-bold">{deadlineFormatted}</div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Due</CardTitle>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div>
            <div className="text-xl font-bold">{paymentDueDateFormatted}</div>
            {isPaymentOverdue && (
              <p className="text-xs text-red-500 mt-1">
                Overdue by {paymentOverdueDays} day{paymentOverdueDays !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfoCards;