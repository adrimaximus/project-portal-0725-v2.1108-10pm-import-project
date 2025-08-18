import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types";
import { Calendar, Wallet, Briefcase, MapPin } from "lucide-react";
import { isSameDay } from "date-fns";
import { DateRangePicker } from "../DateRangePicker";
import { DateRange } from "react-day-picker";
import { CurrencyInput } from "../ui/currency-input";
import ProjectServices from "./ProjectServices";
import { formatInJakarta } from "@/lib/utils";
import { Input } from "../ui/input";

interface ProjectDetailsCardProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
}

const ProjectDetailsCard = ({ project, isEditing, onFieldChange }: ProjectDetailsCardProps) => {
  const handleDateChange = (range: DateRange | undefined) => {
    const startDate = range?.from ? range.from.toISOString() : undefined;
    const endDateValue = range?.to || range?.from;
    const endDate = endDateValue ? endDateValue.toISOString() : undefined;

    onFieldChange('start_date', startDate);
    onFieldChange('due_date', endDate);
  };

  const handleBudgetChange = (value: number | null) => {
    onFieldChange('budget', value || 0);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  const renderDateRange = () => {
    if (!project.start_date) return 'N/A';
    const start = new Date(project.start_date);
    const end = project.due_date ? new Date(project.due_date) : start;

    if (isSameDay(start, end)) {
        return formatInJakarta(project.start_date, "dd MMM yyyy");
    }
    return `${formatInJakarta(project.start_date, "dd MMM yyyy")} - ${formatInJakarta(project.due_date!, "dd MMM yyyy")}`;
  };

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
                  from: project.start_date ? new Date(project.start_date) : undefined,
                  to: project.due_date ? new Date(project.due_date) : undefined,
                }}
                onDateChange={handleDateChange}
              />
            ) : (
              <p className="text-muted-foreground">
                {renderDateRange()}
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
          <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
          <div className="w-full">
            <p className="font-medium">Venue</p>
            {isEditing ? (
              <Input
                value={project.venue || ''}
                onChange={(e) => onFieldChange('venue', e.target.value)}
                placeholder="Enter project venue"
              />
            ) : (
              <p className="text-muted-foreground">
                {project.venue || 'No venue specified'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Briefcase className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
          <div className="w-full">
            <p className="font-medium">Services</p>
            <div className="mt-1">
              <ProjectServices
                selectedServices={project.services || []}
                isEditing={isEditing}
                onServicesChange={(services) => onFieldChange('services', services)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsCard;