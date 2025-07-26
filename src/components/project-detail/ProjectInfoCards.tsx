import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Activity, CreditCard, Wallet, CalendarDays, Ticket, CalendarClock } from "lucide-react";

interface ProjectInfoCardsProps {
  project: Project;
  isEditing: boolean;
  editedProject: Project | null;
  ticketCount: number;
  onSelectChange: (name: 'status' | 'paymentStatus', value: string) => void;
  onDateChange: (name: 'deadline' | 'paymentDueDate', date: Date | undefined) => void;
  onBudgetChange: (value: number | undefined) => void;
}

const ProjectInfoCards = ({
  project,
  isEditing,
  editedProject,
  ticketCount,
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
      case "Paid": return "default";
      case "Pending": return "secondary";
      case "Overdue": return "destructive";
      default: return "outline";
    }
  };

  const budgetFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(project.budget);

  const deadlineFormatted = new Date(project.deadline).toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const paymentDueDateFormatted = project.paymentDueDate
    ? new Date(project.paymentDueDate).toLocaleDateString("en-US", {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : "Not Set";

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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
            <Select value={editedProject.paymentStatus} onValueChange={(value) => onSelectChange('paymentStatus', value)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={getPaymentStatusBadgeVariant(project.paymentStatus)}>
              {project.paymentStatus}
            </Badge>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Due</CardTitle>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing && editedProject ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editedProject.paymentDueDate && "text-muted-foreground")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {editedProject.paymentDueDate ? format(new Date(editedProject.paymentDueDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={editedProject.paymentDueDate ? new Date(editedProject.paymentDueDate) : undefined} onSelect={(date) => onDateChange('paymentDueDate', date)} initialFocus />
              </PopoverContent>
            </Popover>
          ) : (
            <div className="text-xl font-bold">{paymentDueDateFormatted}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
          <Ticket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{ticketCount}</div>
          <p className="text-xs text-muted-foreground">{ticketCount} tickets created</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget</CardTitle>
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
            <div className="text-xl font-bold">{deadlineFormatted}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfoCards;