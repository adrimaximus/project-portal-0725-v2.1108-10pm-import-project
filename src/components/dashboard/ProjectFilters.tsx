import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_STATUSES, PAYMENT_STATUSES } from "@/config/constants";

interface ProjectFiltersProps {
  statusFilter: string;
  paymentStatusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onPaymentStatusFilterChange: (value: string) => void;
}

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
            {PROJECT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
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
            {PAYMENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProjectFilters;