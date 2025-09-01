import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/types";
import { Calendar, Wallet, Briefcase, MapPin, ListTodo, CreditCard } from "lucide-react";
import { isSameDay } from "date-fns";
import { DateRangePicker } from "../DateRangePicker";
import { DateRange } from "react-day-picker";
import { CurrencyInput } from "../ui/currency-input";
import ProjectServices from "./ProjectServices";
import { formatInJakarta, cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "../StatusBadge";
import { Badge } from "@/components/ui/badge";
import AddressAutocompleteInput from '../AddressAutocompleteInput';

interface ProjectDetailsCardProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
}

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
  'Paid': { color: "bg-green-100 text-green-800", label: "Paid" },
  'Pending': { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  'In Process': { color: "bg-purple-100 text-purple-800", label: "In Process" },
  'Overdue': { color: "bg-red-100 text-red-800", label: "Overdue" },
  'Proposed': { color: "bg-blue-100 text-blue-800", label: "Proposed" },
  'Cancelled': { color: "bg-gray-100 text-gray-800", label: "Cancelled" },
};

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

  const paymentBadgeColor = paymentStatusConfig[project.payment_status]?.color || "bg-gray-100 text-gray-800";
  const hasOpenTasks = project.tasks?.some(task => !task.completed);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
        {/* Left Column */}
        <div className="space-y-6">
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
                <AddressAutocompleteInput
                  value={project.venue || ''}
                  onChange={(value) => onFieldChange('venue', value)}
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
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <ListTodo className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
            <div className="w-full">
              <p className="font-medium">Status</p>
              {isEditing ? (
                <Select
                  value={project.status}
                  onValueChange={(value) => onFieldChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUS_OPTIONS.map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        disabled={option.value === 'Completed' && hasOpenTasks}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="pt-1">
                  <StatusBadge status={project.status} />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-4">
            <CreditCard className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
            <div className="w-full">
              <p className="font-medium">Payment Status</p>
              {isEditing ? (
                <Select
                  value={project.payment_status}
                  onValueChange={(value) => onFieldChange('payment_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="pt-1">
                  <Badge variant="outline" className={cn("font-normal", paymentBadgeColor)}>
                    {project.payment_status}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsCard;