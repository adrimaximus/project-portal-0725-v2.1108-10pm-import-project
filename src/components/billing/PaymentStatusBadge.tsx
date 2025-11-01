import { useState, useEffect } from 'react';
import { cn, getPaymentStatusStyles } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_STATUS_OPTIONS, PaymentStatus } from "@/types";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  onStatusChange: (newStatus: PaymentStatus) => void;
}

const PaymentStatusBadge = ({ status, onStatusChange }: PaymentStatusBadgeProps) => {
  const [localStatus, setLocalStatus] = useState(status);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  const styles = getPaymentStatusStyles(localStatus);

  const handleStatusChange = (newStatus: PaymentStatus) => {
    setLocalStatus(newStatus);
    onStatusChange(newStatus);
  };

  return (
    <Select value={localStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="h-auto p-0 border-0 focus:ring-0 focus:ring-offset-0 w-auto bg-transparent shadow-none">
        <SelectValue>
          <Badge variant="outline" className={cn("border-transparent", styles.tw)}>
            {localStatus}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PAYMENT_STATUS_OPTIONS.map(option => (
          <SelectItem 
            key={option.value} 
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PaymentStatusBadge;