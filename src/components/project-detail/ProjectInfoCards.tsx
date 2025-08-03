import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, isPast, differenceInDays, startOfDay } from "date-fns";
import { Activity, CreditCard, Wallet, CalendarDays, CalendarClock } from "lucide-react";

interface ProjectInfoCardsProps {
  project: Project;
  isEditing: boolean;
  editedProject: Project | null;
  onSelectChange: (name: 'status' | 'paymentStatus', value: string) => void;
  onDateChange: (name: 'dueDate' | 'paymentDueDate' | 'startDate', date: Date | undefined) => void;
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
      case "Paid": return "default";
      case "Approved":
      case "PO Created":
      case "On Process":
      case "Pending": 
        return "secondary";
      case "Cancelled": 
        return "destructive";
      case "Proposed": 
        return "outline";
      default: 
        return "outline";
    }
  };

  const formatPaymentStatus = (status: Project["paymentStatus"]) => {
    switch (status) {
      case "PO Created":
        return "PO Created";
      case "On Process":
        return "On Process";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const addWorkingDays = (date: Date, days: number): Date => {
    let currentDate = new Date(date);
    let addedDays = 0;
    while (addedDays < days) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }
    return currentDate;
  };

  const budgetFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(project.budget || 0);

  const startDateFormatted = project.startDate
    ? new Date(project.startDate).toLocaleDateString("en-US", {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : "Not Set";

  const today = startOfDay(new Date());
  
  const projectDueDateObj = startOfDay(new Date(project.dueDate));
  const dueDateFormatted = projectDueDateObj.toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const projectDaysDifference = differenceInDays(projectDueDateObj, today);

  const paymentDueDate = startOfDay(addWorkingDays(projectDueDateObj, 14));
  const paymentDueDateFormatted = paymentDueDate.toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const paymentDaysDifference = differenceInDays(paymentDueDate, today);

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
                <SelectItem value="Proposed">Proposed</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="PO Created">PO Created</SelectItem>
                <SelectItem value="On Process">On Process</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editedProject.startDate && "text-muted-foreground")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {editedProject.startDate ? format(new Date(editedProject.startDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={editedProject.startDate ? new Date(editedProject.startDate) : undefined} onSelect={(date) => onDateChange('startDate', date)} initialFocus />
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
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editedProject.dueDate && "text-muted-foreground")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {editedProject.dueDate ? format(new Date(editedProject.dueDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={new Date(editedProject.dueDate)} onSelect={(date) => onDateChange('dueDate', date)} initialFocus />
              </PopoverContent>
            </Popover>
          ) : (
            <div>
              <div className="text-xl font-bold">{dueDateFormatted}</div>
              {!['Completed', 'Done', 'Cancelled'].includes(project.status) && (
                <>
                  {projectDaysDifference >= 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {projectDaysDifference === 0 ? 'Due today' : `Due in ${projectDaysDifference} day${projectDaysDifference !== 1 ? 's' : ''}`}
                    </p>
                  ) : (
                    <p className="text-xs text-red-500 mt-1">
                      Overdue by {Math.abs(projectDaysDifference)} day{Math.abs(projectDaysDifference) !== 1 ? 's' : ''}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Payment Due</CardTitle>
            <CardDescription className="text-xs text-muted-foreground pt-1">
              14 working days from project due date
            </CardDescription>
          </div>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div>
            <div className="text-xl font-bold">{paymentDueDateFormatted}</div>
            {!['Paid', 'Cancelled'].includes(project.paymentStatus) && (
              <>
                {paymentDaysDifference >= 0 ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    {paymentDaysDifference === 0 ? 'Due today' : `Due in ${paymentDaysDifference} day${paymentDaysDifference !== 1 ? 's' : ''}`}
                  </p>
                ) : (
                  <p className="text-xs text-red-500 mt-1">
                    Overdue by {Math.abs(paymentDaysDifference)} day{Math.abs(paymentDaysDifference) !== 1 ? 's' : ''}
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfoCards;