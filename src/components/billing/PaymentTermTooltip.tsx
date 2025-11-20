import { useState, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
}).format(amount);

const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
};

interface PaymentTermTooltipProps {
  term: any;
  index: number;
  isMultiTerm: boolean;
}

export const PaymentTermTooltip = ({ term, index, isMultiTerm }: PaymentTermTooltipProps) => {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, 500); // Long press 500ms
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
          <div 
            className={cn(
              "text-xs w-full cursor-pointer select-none touch-manipulation", 
              index > 0 && "border-t pt-2 mt-2"
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onContextMenu={(e) => e.preventDefault()} // Prevent default context menu on long press
            onClick={() => setOpen((prev) => !prev)} // Allow tap to toggle as well for accessibility
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-medium">
                {isMultiTerm && (
                  <>
                    <span>Term {index + 1}</span>
                    <span className="text-muted-foreground">|</span>
                  </>
                )}
                <span>{formatCurrency(term.amount || 0)}</span>
              </div>
              <Badge variant="outline" className={cn("border-transparent text-xs whitespace-nowrap", getStatusBadgeStyle(term.status || 'Pending'))}>
                {term.status || 'Pending'}
              </Badge>
            </div>
          </div>
        </TooltipTrigger>
        {(term.request_date || term.release_date) && (
          <TooltipContent>
            <div className="flex flex-col gap-1 text-xs">
              {term.request_date && (
                <p>
                  {term.request_type || 'Due'}: {format(new Date(term.request_date), "dd MMM yyyy")}
                </p>
              )}
              {term.release_date && (
                <p>
                  Scheduled: {format(new Date(term.release_date), "dd MMM yyyy")}
                </p>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};