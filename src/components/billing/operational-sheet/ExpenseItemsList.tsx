import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSpreadsheet, Trash2 } from "lucide-react";

export type BatchExpenseItem = {
  id: string;
  project_id: string;
  project_name?: string;
  beneficiary: string;
  amount: number;
  remarks: string;
  due_date: string;
  category?: string;
  sub_item?: string;
  qty?: number;
  frequency?: number;
  unit_cost?: number;
};

interface ExpenseItemsListProps {
  items: BatchExpenseItem[];
  onRemoveItem: (id: string) => void;
}

export function ExpenseItemsList({ items, onRemoveItem }: ExpenseItemsListProps) {
  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/5">
      <div className="p-3 border-b flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">List ({items.length})</span>
        <Badge variant="outline" className="font-mono bg-green-50 text-green-700 border-green-200">
          Total: {new Intl.NumberFormat('id-ID').format(totalAmount)}
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-2 bg-muted/10">
        {items.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs italic flex flex-col items-center">
            <FileSpreadsheet className="h-8 w-8 mb-2 opacity-20" />
            Added items will appear here.
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {items.map((item) => (
              <Card key={item.id} className="text-sm shadow-sm border-l-4 border-l-primary/20">
                <CardContent className="p-3 flex justify-between items-start gap-2">
                  <div className="space-y-1 overflow-hidden flex-1">
                    <div className="flex items-center gap-2">
                      {item.category && <Badge variant="secondary" className="text-[9px] h-4 px-1">{item.category}</Badge>}
                      <span className="font-medium text-sm truncate">{item.beneficiary}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex gap-2">
                      <span>{item.qty} x {item.frequency} @ {new Intl.NumberFormat('id-ID').format(item.unit_cost || 0)}</span>
                    </div>
                    {item.remarks && <div className="text-[10px] text-muted-foreground truncate opacity-80 italic">{item.remarks}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-mono font-medium text-sm">
                      {new Intl.NumberFormat('id-ID').format(item.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}