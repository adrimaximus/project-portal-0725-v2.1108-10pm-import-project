import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, ProjectStatus, PaymentStatus } from "@/data/projects";
import { format, formatDistanceToNow, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, DollarSign, BarChart, Users, CalendarClock, CheckCircle, AlertCircle, Clock, CircleDashed } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "../ui/input";
import { CurrencyInput } from "react-currency-mask";

interface ProjectInfoCardsProps {
  project: Project;
  isEditing: boolean;
  editedProject: Project;
  onFieldChange: (field: keyof Project, value: any) => void;
  onDateChange: (field: 'startDate' | 'dueDate' | 'paymentDueDate', date: Date | undefined) => void;
  onBudgetChange: (value: number | string) => void;
}

const statusConfig = {
  [ProjectStatus.InProgress]: { icon: Clock, color: "text-blue-500", label: "In Progress" },
  [ProjectStatus.Completed]: { icon: CheckCircle, color: "text-green-500", label: "Completed" },
  [ProjectStatus.OnHold]: { icon: AlertCircle, color: "text-yellow-500", label: "On Hold" },
  [ProjectStatus.Canceled]: { icon: AlertCircle, color: "text-red-500", label: "Canceled" },
};

const paymentStatusConfig = {
  [PaymentStatus.Paid]: { color: "bg-green-100 text-green-800", label: "Paid" },
  [PaymentStatus.Pending]: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  [PaymentStatus.Overdue]: { color: "bg-red-100 text-red-800", label: "Overdue" },
  [PaymentStatus.Draft]: { color: "bg-gray-100 text-gray-800", label: "Draft" },
};

const ProjectInfoCards = ({ project, isEditing, editedProject, onFieldChange, onDateChange, onBudgetChange }: ProjectInfoCardsProps) => {
  const startDateObj = project.startDate ? startOfDay(new Date(project.startDate)) : null;
  const dueDateObj = project.dueDate ? startOfDay(new Date(project.dueDate)) : null;
  const paymentDueDateObj = project.paymentDueDate ? startOfDay(new Date(project.paymentDueDate)) : null;

  const timeRemaining = dueDateObj ? formatDistanceToNow(dueDateObj, { addSuffix: true, locale: id }) : "No due date";
  const paymentDueDateFormatted = paymentDueDateObj
    ? formatDistanceToNow(paymentDueDateObj, { addSuffix: true, locale: id })
    : "Not set";

  const StatusIcon = statusConfig[project.status as ProjectStatus]?.icon || CircleDashed;
  const statusColor = statusConfig[project.status as ProjectStatus]?.color || "text-muted-foreground";

  const paymentBadgeColor = paymentStatusConfig[project.paymentStatus as PaymentStatus]?.color || "bg-gray-100 text-gray-800";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <StatusIcon className={cn("h-4 w-4", statusColor)} />
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Select
              value={editedProject.status}
              onValueChange={(value) => onFieldChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ProjectStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-2xl font-bold">{project.status}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Last updated {formatDistanceToNow(new Date(), { addSuffix: true, locale: id })}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing ? (
             <CurrencyInput
                value={editedProject.budget}
                onChangeValue={(_, value) => onBudgetChange(value)}
                InputElement={<Input className="text-2xl font-bold h-auto p-0 border-none focus-visible:ring-0" />}
              />
          ) : (
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(project.budget)}
            </div>
          )}
          {isEditing ? (
            <Select
              value={editedProject.paymentStatus}
              onValueChange={(value) => onFieldChange('paymentStatus', value)}
            >
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PaymentStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground">
              <Badge variant="outline" className={cn("font-normal", paymentBadgeColor)}>
                {project.paymentStatus}
              </Badge>
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Timeline</CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editedProject.startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedProject.startDate ? format(new Date(editedProject.startDate), "PPP") : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={editedProject.startDate ? new Date(editedProject.startDate) : undefined} onSelect={(date) => onDateChange('startDate', date)} initialFocus />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editedProject.dueDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedProject.dueDate ? format(new Date(editedProject.dueDate), "PPP") : <span>Due date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={editedProject.dueDate ? new Date(editedProject.dueDate) : undefined} onSelect={(date) => onDateChange('dueDate', date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div className="text-2xl font-bold">{timeRemaining}</div>
          )}
          {!isEditing && <p className="text-xs text-muted-foreground">
            {startDateObj ? format(startDateObj, "d MMM yyyy", { locale: id }) : 'N/A'} - {dueDateObj ? format(dueDateObj, "d MMM yyyy", { locale: id }) : 'N/A'}
          </p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Due</CardTitle>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing ? (
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
            <div className="text-2xl font-bold">{paymentDueDateFormatted}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {paymentDueDateObj ? format(paymentDueDateObj, "EEEE, d MMMM yyyy", { locale: id }) : "No due date set"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfoCards;