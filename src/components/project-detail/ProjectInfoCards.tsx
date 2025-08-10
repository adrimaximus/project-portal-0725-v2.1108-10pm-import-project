import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, differenceInDays, startOfDay } from "date-fns";
import { Activity, CreditCard, Wallet, CalendarDays, CalendarClock } from "lucide-react";
import StatusBadge from "../StatusBadge";

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

  const paymentDueDateObj = project.paymentDueDate ? startOfDay(new Date(project.paymentDueDate)) : null;
  const paymentDueDateFormatted = paymentDueDateObj
    ? paymentDueDateObj.toLocaleDateString("en-US", {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : "Not Set";
  const paymentDaysDifference = paymentDueDateObj ? differenceInDays(paymentDueDateObj, today) : 0;

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
            <StatusBadge status={project.status} />
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
            <StatusBadge status={project.paymentStatus} />
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
          {isEditing && editedProject ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editedProject.paymentDueDate && "text-muted-foreground")}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {editedProject.paymentDueDate ? format(new Date(editedProject.paymentDueDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={editedProject.paymentDueDate ? new Date(editedProject.paymentDueDate) : undefined} onSelect={(date) => onDateChange('paymentDueDate', date)} initialFocus />
              </PopoverContent>
            </Popover>
          ) : (
            <div>
              <div className="text-xl font-bold">{paymentDueDateFormatted}</div>
              {paymentDueDateObj && !['Paid', 'Cancelled'].includes(project.paymentStatus) && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfoCards;