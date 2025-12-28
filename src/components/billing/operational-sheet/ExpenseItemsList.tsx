import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Edit2, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface BatchExpenseItem {
  id: string;
  project_id: string;
  project_name?: string;
  beneficiary: string;
  sub_item: string;
  category?: string;
  qty: number;
  frequency: number;
  unit_cost: number;
  amount: number;
  remarks: string;
  due_date?: string;
  isManual?: boolean;
}

interface ExpenseItemsListProps {
  items: BatchExpenseItem[];
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<BatchExpenseItem>) => void;
}

export function ExpenseItemsList({ items, onRemoveItem, onUpdateItem }: ExpenseItemsListProps) {
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/5">
        <p className="text-sm">No items yet.</p>
        <p className="text-xs mt-1">Import from sheet or add manually.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-border/50">
        {items.map((item) => (
          <div key={item.id} className="p-3 hover:bg-muted/30 group transition-colors flex gap-3 items-start">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                {/* project_name is used to store Category in the OperationalSheetDialog context */}
                {item.category && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0 border-blue-200 text-blue-700 bg-blue-50">
                        {item.category}
                    </Badge>
                )}
                {item.isManual && (
                     <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0 bg-muted text-muted-foreground">
                        Manual
                     </Badge>
                )}
                <span className="font-medium text-sm truncate text-foreground/90" title={item.sub_item}>
                    {item.sub_item}
                </span>
              </div>
              
              <div className="flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground flex-wrap">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="cursor-help border-b border-dashed border-muted-foreground/50 hover:text-foreground transition-colors">
                                {item.qty} x {item.frequency} x {formatCurrency(item.unit_cost)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                            <p>Quantity: {item.qty}</p>
                            <p>Frequency: {item.frequency}</p>
                            <p>Unit Cost: {formatCurrency(item.unit_cost)}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <span className="font-medium text-foreground">{formatCurrency(item.amount)}</span>
                
                {item.remarks && (
                    <span className="text-muted-foreground italic truncate max-w-[200px]" title={item.remarks}>
                         — {item.remarks}
                    </span>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemoveItem(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}