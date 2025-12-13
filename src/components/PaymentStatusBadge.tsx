import { usePaymentStatuses } from "@/hooks/usePaymentStatuses";
import { cn, getTextColor } from "@/lib/utils";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface PaymentStatusBadgeProps {
  status: string;
  onStatusChange: (newStatus: string) => void;
}

const PaymentStatusBadge = ({ status, onStatusChange }: PaymentStatusBadgeProps) => {
  const { data: paymentStatuses = [], isLoading } = usePaymentStatuses();

  const currentStatus = paymentStatuses.find(s => s.name === status);
  const bgColor = currentStatus?.color || '#94a3b8';
  const textColor = getTextColor(bgColor);

  if (isLoading) {
    return (
      <Badge 
        variant="outline" 
        className={cn("font-normal border-transparent")}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {status}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant="outline"
          className={cn("font-normal border-transparent cursor-pointer hover:opacity-80 transition-opacity")}
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {status}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {paymentStatuses.map(option => (
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
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PaymentStatusBadge;