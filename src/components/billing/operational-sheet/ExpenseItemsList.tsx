import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, Wand2, Calculator, Bot, Pencil, Check, X } from "lucide-react";

export interface BatchExpenseItem {
  id: string;
  project_id: string;
  project_name?: string;
  category: string;
  sub_item: string;
  beneficiary: string;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BatchExpenseItem>>({});

  const startEdit = (item: BatchExpenseItem) => {
    setEditingId(item.id);
    setEditValues({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = (id: string) => {
    onUpdateItem(id, editValues);
    setEditingId(null);
    setEditValues({});
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 border-t min-h-[300px] bg-muted/5">
        <div className="bg-purple-50 p-4 rounded-full mb-3 border border-purple-100">
          <Bot className="h-8 w-8 text-purple-500" />
        </div>
        <h3 className="font-medium text-foreground mb-1">AI Agent Ready</h3>
        <p className="text-xs text-center max-w-[280px] leading-relaxed">
          Ensure your Google Sheet has a tab named <strong>"Ajuan"</strong>.
          <br />
          Click <span className="font-semibold text-purple-600">Sync Agent</span> to extract items automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10 min-h-[300px] max-h-[600px]">
      {items.map((item) => {
        const isEditing = editingId === item.id;

        return (
          <div key={item.id} className={`bg-white p-3 rounded-lg border shadow-sm flex gap-3 group relative transition-colors ${isEditing ? 'border-purple-400 ring-1 ring-purple-100' : 'hover:border-purple-200'}`}>
            <div className="mt-1 shrink-0" title={item.isManual ? "Manual Entry" : "AI Extracted"}>
              {item.isManual ? (
                <Calculator className="h-4 w-4 text-orange-500" />
              ) : (
                <Wand2 className="h-4 w-4 text-purple-600" />
              )}
            </div>
            
            <div className="space-y-1 overflow-hidden flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input 
                      value={editValues.category || ""} 
                      onChange={e => setEditValues(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Category"
                      className="h-7 text-xs w-24"
                    />
                    <Input 
                      value={editValues.beneficiary || ""} 
                      onChange={e => setEditValues(prev => ({ ...prev, beneficiary: e.target.value, sub_item: e.target.value }))}
                      placeholder="Item Name"
                      className="h-7 text-xs flex-1"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="number"
                      value={editValues.qty || 0} 
                      onChange={e => setEditValues(prev => ({ ...prev, qty: parseFloat(e.target.value) || 0 }))}
                      className="h-7 text-xs w-14"
                      placeholder="Qty"
                    />
                    <span className="text-xs text-muted-foreground">x</span>
                    <Input 
                      type="number"
                      value={editValues.frequency || 1} 
                      onChange={e => setEditValues(prev => ({ ...prev, frequency: parseFloat(e.target.value) || 1 }))}
                      className="h-7 text-xs w-14"
                      placeholder="Freq"
                    />
                    <span className="text-xs text-muted-foreground">x</span>
                    <Input 
                      type="number"
                      value={editValues.unit_cost || 0} 
                      onChange={e => setEditValues(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                      className="h-7 text-xs flex-1"
                      placeholder="Cost"
                    />
                  </div>
                  <Input 
                    value={editValues.remarks || ""} 
                    onChange={e => setEditValues(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Remarks"
                    className="h-7 text-xs w-full"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {item.category && <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">{item.category}</Badge>}
                    <span className="font-medium text-sm truncate" title={item.beneficiary}>{item.beneficiary}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-foreground">{item.qty}</span>
                      {item.frequency > 1 ? (
                        <>
                          <span className="text-muted-foreground">x</span>
                          <span className="font-mono text-foreground" title="Frequency/Days">{item.frequency}</span>
                          <span className="text-muted-foreground">x</span>
                        </>
                      ) : (
                         <span className="text-muted-foreground">x</span>
                      )}
                      <span className="font-mono text-foreground">{new Intl.NumberFormat('id-ID').format(item.unit_cost)}</span>
                    </div>
                    <div className="truncate" title={item.remarks || "No remarks"}>
                      {item.remarks || "-"}
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-muted-foreground truncate">
                     {item.project_name || "Unknown Project"}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col items-end justify-between gap-1 shrink-0 pl-2 border-l ml-1 min-w-[70px]">
              <span className="font-mono font-bold text-sm text-purple-700">
                {isEditing 
                  ? new Intl.NumberFormat('id-ID').format((editValues.qty || 0) * (editValues.frequency || 1) * (editValues.unit_cost || 0))
                  : new Intl.NumberFormat('id-ID').format(item.amount)
                }
              </span>
              
              <div className="flex gap-1">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => saveEdit(item.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={cancelEdit}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => startEdit(item)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}