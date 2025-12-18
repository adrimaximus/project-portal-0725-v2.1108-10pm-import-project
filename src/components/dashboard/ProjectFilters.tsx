import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/data/projectOptions";

interface ProjectFiltersProps {
  statusFilter: string;
  paymentStatusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onPaymentStatusFilterChange: (value: string) => void;
}

const projectStatuses = [{ value: "All", label: "All" }, ...PROJECT_STATUS_OPTIONS];
const paymentStatuses = [{ value: "All", label: "All" }, ...PAYMENT_STATUS_OPTIONS];

const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  statusFilter,
  paymentStatusFilter,
  onStatusFilterChange,
  onPaymentStatusFilterChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground mb-2 block">
          Project Status
        </label>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger id="status-filter" className="w-full">
            <SelectValue placeholder="Filter by project status..." />
          </SelectTrigger>
          <SelectContent>
            {projectStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <label htmlFor="payment-filter" className="text-sm font-medium text-muted-foreground mb-2 block">
          Payment Status
        </label>
        <Select value={paymentStatusFilter} onValueChange={onPaymentStatusFilterChange}>
          <SelectTrigger id="payment-filter" className="w-full">
            <SelectValue placeholder="Filter by payment status..." />
          </SelectTrigger>
          <SelectContent>
            {paymentStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProjectFilters;