import { useState, useEffect } from 'react';
import { cn, getTextColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentStatus } from "@/types";
import { usePaymentStatuses } from '@/hooks/usePaymentStatuses';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  onStatusChange: (newStatus: PaymentStatus) => void;
}

const PaymentStatusBadge = ({ status, onStatusChange }: PaymentStatusBadgeProps) => {
  const [localStatus, setLocalStatus] = useState(status);
  const { data: paymentStatuses = [], isLoading } = usePaymentStatuses();

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  const currentStatus = paymentStatuses.find(s => s.name === localStatus);
  const bgColor = currentStatus?.color || '#94a3b8';
  const textColor = getTextColor(bgColor);

  const handleStatusChange = (newStatus: PaymentStatus) => {
    setLocalStatus(newStatus);
    onStatusChange(newStatus);
  };

  return (
    <Select value={localStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="h-auto p-0 border-0 focus:ring-0 focus:ring-offset-0 w-auto bg-transparent shadow-none">
        <SelectValue>
          <Badge 
            variant="outline" 
            className={cn("border-transparent")}
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {localStatus}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>Loading...</SelectItem>
        ) : (
          paymentStatuses.map(option => (
            <SelectItem 
              key={option.id} 
              value={option.name}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color }} />
                {option.name}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default PaymentStatusBadge;