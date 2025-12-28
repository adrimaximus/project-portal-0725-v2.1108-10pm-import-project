import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Project } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

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
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [category, setCategory] = useState("");
  const [subItem, setSubItem] = useState("");
  const [qty, setQty] = useState("1");
  const [frequency, setFrequency] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [remarks, setRemarks] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);

  // Update default project if projects load late
  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  const handleSubmit = () => {
    if (!subItem || !unitCost) return;

    onAdd({
      projectId,
      category: category || "General",
      subItem,
      qty,
      frequency,
      unitCost,
      remarks,
      dueDate
    });

    // Reset fields for next entry, keep Category and Project
    setSubItem("");
    setUnitCost("");
    setRemarks("");
    // Keep Qty and Freq defaults
    setQty("1");
    setFrequency("1");
  };

  const calculatedTotal = (parseFloat(qty || "0") * parseFloat(frequency || "0") * parseFloat(unitCost || "0"));

  return (
    <div className="p-4 space-y-4 bg-muted/10 border-b">
        <h3 className="font-semibold text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Manual Entry
        </h3>
        
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs">Project</Label>
                    <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Category (e.g. F&B)</Label>
                    <Input 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)} 
                        placeholder="Pos / Division" 
                        className="h-8 text-xs bg-background"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <Label className="text-xs">Item Name / Sub Item <span className="text-red-500">*</span></Label>
                <Input 
                    value={subItem} 
                    onChange={(e) => setSubItem(e.target.value)} 
                    placeholder="e.g. Meals for Crew" 
                    className="h-8 text-xs bg-background"
                />
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input 
                        type="number" 
                        min="1"
                        value={qty} 
                        onChange={(e) => setQty(e.target.value)} 
                        className="h-8 text-xs bg-background"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Freq/Days</Label>
                    <Input 
                        type="number" 
                        min="1"
                        value={frequency} 
                        onChange={(e) => setFrequency(e.target.value)} 
                        className="h-8 text-xs bg-background"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Unit Cost <span className="text-red-500">*</span></Label>
                    <Input 
                        type="number" 
                        min="0"
                        value={unitCost} 
                        onChange={(e) => setUnitCost(e.target.value)} 
                        placeholder="Rp" 
                        className="h-8 text-xs bg-background"
                    />
                </div>
            </div>

            <div className="pt-1 flex justify-between items-center text-xs font-medium text-muted-foreground px-1">
                <span>Total:</span>
                <span className="text-foreground font-bold text-sm">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(calculatedTotal)}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                     <Label className="text-xs">Date</Label>
                     <Input 
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="h-8 text-xs bg-background"
                     />
                </div>
                <div className="space-y-1">
                     <Label className="text-xs">Remarks</Label>
                     <Input 
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Optional notes"
                        className="h-8 text-xs bg-background"
                     />
                </div>
            </div>

            <Button onClick={handleSubmit} disabled={!subItem || !unitCost} size="sm" className="w-full text-xs">
                Add Item
            </Button>
        </div>
    </div>
  );
}