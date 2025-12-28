import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, Tags } from "lucide-react";
import { Project } from "@/types";
import { toast } from "sonner";

export interface ExpenseFormData {
  projectId: string;
  category: string;
  subItem: string;
  qty: string;
  frequency: string;
  unitCost: string;
  remarks: string;
  dueDate: string;
}

interface ManualEntryFormProps {
  projects: Project[];
  onAdd: (data: ExpenseFormData) => void;
}

export function ManualEntryForm({ projects, onAdd }: ManualEntryFormProps) {
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState("");
  const [subItem, setSubItem] = useState("");
  const [qty, setQty] = useState("1");
  const [frequency, setFrequency] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [remarks, setRemarks] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const calculatedAmount = useMemo(() => {
    return (parseFloat(qty || "0") * parseFloat(frequency || "0") * parseFloat(unitCost || "0"));
  }, [qty, frequency, unitCost]);

  const handleAdd = () => {
    if (!projectId || !subItem || !calculatedAmount) {
      toast.error("Please fill in Project, Item Name, and Cost details.");
      return;
    }

    onAdd({
      projectId,
      category,
      subItem,
      qty,
      frequency,
      unitCost,
      remarks,
      dueDate
    });

    // Reset fields for next entry
    setSubItem("");
    setUnitCost("");
    setRemarks("");
  };

  return (
    <div className="p-4 border-b space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Calculator className="h-3 w-3" /> Manual Entry
        </h3>
        <Badge variant="secondary" className="text-[10px]">IDR</Badge>
      </div>

      <div className="space-y-3">
        {/* Project & Category Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Category (Items)</Label>
            <div className="relative">
              <Tags className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
              <Input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. F&B"
                className="h-8 text-xs pl-7"
              />
            </div>
          </div>
        </div>

        {/* Item Name */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Sub Item / Beneficiary</Label>
          <Input
            value={subItem}
            onChange={e => setSubItem(e.target.value)}
            placeholder="e.g. Meals crew"
            className="h-8 text-xs font-medium"
          />
        </div>

        {/* Calculation Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Qty</Label>
            <Input
              type="number"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="h-8 text-xs text-center"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Freq/Day</Label>
            <Input
              type="number"
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className="h-8 text-xs text-center"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Unit Cost</Label>
            <Input
              type="number"
              value={unitCost}
              onChange={e => setUnitCost(e.target.value)}
              placeholder="0"
              className="h-8 text-xs text-right"
            />
          </div>
        </div>

        {/* Subtotal Display */}
        <div className="bg-muted/30 p-2 rounded-md flex justify-between items-center border border-dashed">
          <span className="text-xs text-muted-foreground">Sub-Total:</span>
          <span className="font-mono font-bold text-sm text-primary">
            {new Intl.NumberFormat('id-ID').format(calculatedAmount)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1 col-span-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-[10px] uppercase text-muted-foreground">Remarks</Label>
            <Input
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Optional details..."
              className="h-8 text-xs"
            />
          </div>
        </div>

        <Button onClick={handleAdd} className="w-full h-8 text-xs" size="sm" variant="secondary">
          <Plus className="h-3 w-3 mr-1" /> Add Entry
        </Button>
      </div>
    </div>
  );
}