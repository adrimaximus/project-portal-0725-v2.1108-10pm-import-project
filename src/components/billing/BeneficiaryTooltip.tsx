import { useState, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BeneficiaryTooltipProps {
  expense: any;
}

export const BeneficiaryTooltip = ({ expense }: BeneficiaryTooltipProps) => {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasBankInfo = expense.account_bank && expense.account_bank.name;

  if (!hasBankInfo) {
    return <span>{expense.beneficiary}</span>;
  }

  const handleTouchStart = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleTouchMove = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <span 
            className="cursor-help underline decoration-dotted select-none touch-manipulation"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onContextMenu={(e) => e.preventDefault()}
            onClick={() => setOpen((prev) => !prev)}
          >
            {expense.beneficiary}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-0.5 text-xs">
            <p className="font-semibold">{expense.account_bank.name}</p>
            <p className="text-muted-foreground">{expense.account_bank.bank}</p>
            <p className="text-muted-foreground">{expense.account_bank.account}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};