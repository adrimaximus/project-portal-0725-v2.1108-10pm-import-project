import { PaymentStatus, PAYMENT_STATUS_OPTIONS } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dispatch, SetStateAction } from "react";

export interface BillingToolbarProps {
  statusFilter: PaymentStatus | 'all';
  onStatusFilterChange: Dispatch<SetStateAction<PaymentStatus | 'all'>>;
}

const BillingToolbar = ({ statusFilter, onStatusFilterChange }: BillingToolbarProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as PaymentStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PAYMENT_STATUS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BillingToolbar;