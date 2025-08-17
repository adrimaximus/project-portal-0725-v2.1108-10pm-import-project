import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types";
import { Calendar, Wallet, Briefcase } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { DateRangePicker } from "../DateRangePicker";
import { DateRange } from "react-day-picker";
import { CurrencyInput } from "../ui/currency-input";
import { Badge } from "@/components/ui/badge";
import { services as allServicesData, Service } from "@/data/services";
import { cn } from "@/lib/utils";

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

    onFieldChange('startDate', startDate);
    onFieldChange('dueDate', endDate);
  };

  const handleBudgetChange = (value: number | null) => {
    onFieldChange('budget', value || 0);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  const serviceDetails = (project.services || [])
    .map((serviceName) => allServicesData.find((s) => s.title === serviceName))
    .filter((s): s is Service => s !== undefined);

  const renderDateRange = () => {
    if (!project.startDate) return 'N/A';
    const start = new Date(project.startDate);
    const end = project.dueDate ? new Date(project.dueDate) : start;

    if (isSameDay(start, end)) {
        return format(start, "dd MMM yyyy");
    }
    return `${format(start, "dd MMM yyyy")} - ${format(end, "dd MMM yyyy")}`;
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
                  from: project.startDate ? new Date(project.startDate) : undefined,
                  to: project.dueDate ? new Date(project.dueDate) : undefined,
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
          <Briefcase className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Services</p>
            {isEditing ? (
              <p className="text-muted-foreground text-xs">Services can be edited in the main content area below.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {serviceDetails.length > 0 ? (
                  serviceDetails.map((service) => (
                    <Badge
                      key={service.title}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <service.icon className={cn("h-4 w-4", service.iconColor)} />
                      <span>{service.title}</span>
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No services selected.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsCard;