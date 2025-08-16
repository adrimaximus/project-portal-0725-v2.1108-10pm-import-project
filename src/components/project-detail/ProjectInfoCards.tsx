import { Project, ProjectStatus } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CircleDollarSign, Flag } from "lucide-react";
import { getStatusStyles } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/datepicker";
import { Input } from "@/components/ui/input";

interface ProjectInfoCardsProps {
  project: Project;
  isEditing: boolean;
  editedProject: Project;
  onFieldChange: (field: keyof Project, value: any) => void;
  onDateChange: (field: 'startDate' | 'dueDate' | 'paymentDueDate', value: Date | null) => void;
  onBudgetChange: (value: number | undefined) => void;
}

const projectStatuses = Object.values(ProjectStatus);

const ProjectInfoCards = ({ project, isEditing, editedProject, onFieldChange, onDateChange, onBudgetChange }: ProjectInfoCardsProps) => {
  const statusStyles = getStatusStyles(project.status);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <Flag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Select
              value={editedProject.status}
              onValueChange={(value: ProjectStatus) => onFieldChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {projectStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    <span className="flex items-center">
                      <span className={`mr-2 h-2 w-2 rounded-full ${getStatusStyles(status).tw}`}></span>
                      {status}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center">
              <span className={`mr-2 h-2 w-2 rounded-full ${statusStyles.tw}`}></span>
              <div className="text-2xl font-bold">{project.status}</div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing ? (
             <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="number"
                    value={editedProject.budget || ''}
                    onChange={(e) => onBudgetChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Enter budget"
                    className="pl-8"
                />
            </div>
          ) : (
            <div className="text-2xl font-bold">
              {project.budget ? `$${project.budget.toLocaleString()}` : "Not set"}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Start Date</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <DatePicker
              date={editedProject.startDate ? parseISO(editedProject.startDate) : undefined}
              setDate={(date) => onDateChange('startDate', date || null)}
            />
          ) : (
            <div className="text-2xl font-bold">
              {project.startDate ? format(parseISO(project.startDate), "MMM d, yyyy") : "Not set"}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due Date</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <DatePicker
              date={editedProject.dueDate ? parseISO(editedProject.dueDate) : undefined}
              setDate={(date) => onDateChange('dueDate', date || null)}
            />
          ) : (
            <div className="text-2xl font-bold">
              {project.dueDate ? format(parseISO(project.dueDate), "MMM d, yyyy") : "Not set"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfoCards;