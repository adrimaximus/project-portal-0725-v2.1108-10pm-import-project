import { useMemo } from "react";
import { usePaymentStatuses } from "@/hooks/usePaymentStatuses";
import { cn, getTextColor, getPaymentStatusStyles } from "@/lib/utils";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { PAYMENT_STATUS_OPTIONS, PaymentStatus } from "@/types";

interface PaymentStatusBadgeProps {
  status: string;
  onStatusChange: (newStatus: string) => void;
}

const PaymentStatusBadge = ({ status, onStatusChange }: PaymentStatusBadgeProps) => {
  const { data: paymentStatuses = [] } = usePaymentStatuses();

  const options = useMemo(() => {
    if (paymentStatuses.length > 0) {
      return paymentStatuses.map(s => ({ id: s.id, name: s.name, color: s.color || '#94a3b8' }));
    }
    // Fallback to hardcoded options if database is empty or loading
    return PAYMENT_STATUS_OPTIONS.map(opt => ({
      id: opt.value,
      name: opt.label,
      color: getPaymentStatusStyles(opt.value as PaymentStatus).hex,
    }));
  }, [paymentStatuses]);

  const currentStatus = options.find(s => s.name === status);
  const bgColor = currentStatus?.color || getPaymentStatusStyles(status as PaymentStatus).hex || '#94a3b8';
  const textColor = getTextColor(bgColor);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Badge
          variant="outline"
          className={cn("font-normal border-transparent cursor-pointer hover:opacity-80 transition-opacity")}
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {status}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.length > 0 ? (
          options.map(option => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => onStatusChange(option.name)}
              disabled={option.name === status}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color }} />
                {option.name}
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No statuses available</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PaymentStatusBadge;