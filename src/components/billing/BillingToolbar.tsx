import { PaymentStatus } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_STATUS_OPTIONS } from "@/types";

interface BillingToolbarProps {
  statusFilter: PaymentStatus | 'all';
  onStatusFilterChange: (status: PaymentStatus | 'all') => void;
}

const BillingToolbar = ({ statusFilter, onStatusFilterChange }: BillingToolbarProps) => {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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