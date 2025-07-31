import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, ProjectStatus, PaymentStatus } from "@/data/projects";
import { Calendar, DollarSign, CheckCircle, AlertTriangle, XCircle, PauseCircle, Clock, BadgePercent } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/input";

const getStatusIcon = (status: ProjectStatus) => {
  const icons: Record<ProjectStatus, JSX.Element> = {
    'On Track': <CheckCircle className="h-5 w-5 text-green-500" />,
    'At Risk': <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    'Off Track': <XCircle className="h-5 w-5 text-red-500" />,
    'On Hold': <PauseCircle className="h-5 w-5 text-gray-500" />,
    'Completed': <CheckCircle className="h-5 w-5 text-blue-500" />,
    'Requested': <Clock className="h-5 w-5 text-gray-500" />,
    'In Progress': <Clock className="h-5 w-5 text-blue-500" />,
    'Cancelled': <XCircle className="h-5 w-5 text-red-500" />,
    'Billed': <DollarSign className="h-5 w-5 text-green-500" />,
    'Done': <CheckCircle className="h-5 w-5 text-green-500" />,
  };
  return icons[status] || <Clock className="h-5 w-5 text-gray-500" />;
};

const getPaymentStatusInfo = (status: PaymentStatus) => {
  const info: Record<PaymentStatus, { icon: JSX.Element; color: string }> = {
    'Paid': { icon: <CheckCircle className="h-5 w-5" />, color: "text-green-500" },
    'Approved': { icon: <CheckCircle className="h-5 w-5" />, color: "text-green-500" },
    'PO Created': { icon: <CheckCircle className="h-5 w-5" />, color: "text-blue-500" },
    'On Process': { icon: <Clock className="h-5 w-5" />, color: "text-blue-500" },
    'Unpaid': { icon: <AlertTriangle className="h-5 w-5" />, color: "text-yellow-500" },
    'Pending': { icon: <PauseCircle className="h-5 w-5" />, color: "text-gray-500" },
    'Overdue': { icon: <XCircle className="h-5 w-5" />, color: "text-red-500" },
    'Cancelled': { icon: <XCircle className="h-5 w-5" />, color: "text-red-500" },
    'Proposed': { icon: <AlertTriangle className="h-5 w-5" />, color: "text-yellow-500" },
  };
  return info[status] || { icon: <Clock className="h-5 w-5" />, color: "text-gray-500" };
};

interface ProjectInfoCardsProps {
  project: Project;
  isEditing: boolean;
  editedProject: Project;
  onSelectChange: (name: 'status' | 'paymentStatus', value: string) => void;
  onDateChange: (name: 'deadline' | 'paymentDueDate', date: Date | undefined) => void;
  onBudgetChange: (value: number | undefined) => void;
}

const ProjectInfoCards = ({ project, isEditing, editedProject, onSelectChange, onDateChange, onBudgetChange }: ProjectInfoCardsProps) => {
  const paymentStatusInfo = getPaymentStatusInfo(editedProject.paymentStatus);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          {getStatusIcon(editedProject.status)}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Select value={editedProject.status} onValueChange={(value) => onSelectChange('status', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="On Track">On Track</SelectItem>
                <SelectItem value="At Risk">At Risk</SelectItem>
                <SelectItem value="Off Track">Off Track</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-2xl font-bold">{project.status}</div>
          )}
        </CardContent>
      </Card>

      {/* Deadline Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deadline</CardTitle>
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <DatePicker date={parseISO(editedProject.deadline)} setDate={(date) => onDateChange('deadline', date)} />
          ) : (
            <div className="text-2xl font-bold">{format(parseISO(project.deadline), "MMM d, yyyy")}</div>
          )}
        </CardContent>
      </Card>

      {/* Budget Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget</CardTitle>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Input
              type="number"
              value={editedProject.budget}
              onChange={(e) => onBudgetChange(e.target.valueAsNumber)}
              placeholder="Enter budget"
            />
          ) : (
            <div className="text-2xl font-bold">${project.budget.toLocaleString()}</div>
          )}
        </CardContent>
      </Card>

      {/* Payment Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment</CardTitle>
          <span className={paymentStatusInfo.color}>{paymentStatusInfo.icon}</span>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Select value={editedProject.paymentStatus} onValueChange={(value) => onSelectChange('paymentStatus', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-2xl font-bold">{project.paymentStatus}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfoCards;