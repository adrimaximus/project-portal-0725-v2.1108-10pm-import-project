import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types";
import { Calendar, Wallet, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { DateRangePicker } from "../DateRangePicker";
import { DateRange } from "react-day-picker";
import { CurrencyInput } from "../ui/currency-input";

interface ProjectDetailsCardProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
}

const ProjectDetailsCard = ({ project, isEditing, onFieldChange }: ProjectDetailsCardProps) => {
  const handleDateChange = (range: DateRange | undefined) => {
    onFieldChange('startDate', range?.from?.toISOString());
    onFieldChange('dueDate', range?.to?.toISOString());
  };

  const handleBudgetChange = (value: number | null) => {
    onFieldChange('budget', value || 0);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-start gap-4">
          <Calendar className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
          <div className="w-full">
            <p className="font-medium">Timeline</p>
            {isEditing ? (
              <DateRangePicker
                date={{
                  from: project.startDate ? new Date(project.startDate) : undefined,
                  to: project.dueDate ? new Date(project.dueDate) : undefined,
                }}
                onDateChange={handleDateChange}
              />
            ) : (
              <p className="text-muted-foreground">
                {project.startDate ? format(new Date(project.startDate), "dd MMM yyyy") : 'N/A'} - {project.dueDate ? format(new Date(project.dueDate), "dd MMM yyyy") : 'N/A'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Wallet className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Budget</p>
            {isEditing ? (
              <CurrencyInput
                value={project.budget || 0}
                onChange={handleBudgetChange}
                placeholder="Enter budget"
                className="w-full"
              />
            ) : (
              <p className="text-muted-foreground">
                {formatCurrency(project.budget || 0)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Briefcase className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Services</p>
            <p className="text-muted-foreground">
              {(project.services || []).join(", ")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsCard;