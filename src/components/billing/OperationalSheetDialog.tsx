import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, FileSpreadsheet, Save, Link as LinkIcon, Loader2, Wand2, Calculator, Tags } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface OperationalSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BatchExpenseItem = {
  id: string;
  project_id: string;
  project_name?: string;
  beneficiary: string; // Will store the "Item" name if no specific person
  amount: number;
  remarks: string;
  due_date: string;
  // Operational Sheet Specifics
  category?: string; // ITEMS column
  sub_item?: string; // SUB ITEMS column
  qty?: number;
  frequency?: number;
  unit_cost?: number;
};

export default function OperationalSheetDialog({ open, onOpenChange }: OperationalSheetDialogProps) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [items, setItems] = useState<BatchExpenseItem[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const queryClient = useQueryClient();

  // Form State
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState("");
  const [subItem, setSubItem] = useState(""); // Maps to Beneficiary/Item Name
  const [qty, setQty] = useState("1");
  const [frequency, setFrequency] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [remarks, setRemarks] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, slug')
        .not('status', 'eq', 'Completed')
        .not('status', 'eq', 'Cancelled')
        .order('name');
      if (error) throw error;
      return data as Project[];
    },
    enabled: open
  });

  // Calculate Sub-Total live
  const calculatedAmount = (parseFloat(qty || "0") * parseFloat(frequency || "0") * parseFloat(unitCost || "0"));

  const handleSheetUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setSheetUrl(url);
    
    try {
        if (url.includes("docs.google.com/spreadsheets")) {
            const baseUrl = url.split("/edit")[0];
            setEmbedUrl(`${baseUrl}/preview?widget=true&headers=false`);
        } else {
            setEmbedUrl("");
        }
    } catch {
        setEmbedUrl("");
    }
  };

  const handleAiExtraction = async () => {
    if (!sheetUrl) {
        toast.error("Please enter a Google Sheet URL first.");
        return;
    }
    
    // Simulate AI Processing
    setIsAiLoading(true);
    toast.info("AI Agent is analyzing the sheet...", { description: "Extracting items, quantities, and costs." });

    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock extracted data based on the provided screenshot context
    const mockItems: BatchExpenseItem[] = [
        {
            id: crypto.randomUUID(),
            project_id: projectId || projects[0]?.id,
            project_name: projects.find(p => p.id === (projectId || projects[0]?.id))?.name,
            category: "F&B",
            sub_item: "Meals crew",
            beneficiary: "Meals crew", // Mapping sub-item to beneficiary for display
            qty: 12,
            frequency: 1,
            unit_cost: 50000,
            amount: 600000,
            remarks: "Event 17 des",
            due_date: new Date().toISOString().split('T')[0]
        },
        {
            id: crypto.randomUUID(),
            project_id: projectId || projects[0]?.id,
            project_name: projects.find(p => p.id === (projectId || projects[0]?.id))?.name,
            category: "F&B",
            sub_item: "Aqua botol",
            beneficiary: "Aqua botol",
            qty: 4,
            frequency: 1,
            unit_cost: 81900,
            amount: 327600,
            remarks: "600ml",
            due_date: new Date().toISOString().split('T')[0]
        },
        {
            id: crypto.randomUUID(),
            project_id: projectId || projects[0]?.id,
            project_name: projects.find(p => p.id === (projectId || projects[0]?.id))?.name,
            category: "Transport & Accomodation",
            sub_item: "Bensin",
            beneficiary: "Bensin",
            qty: 1,
            frequency: 2,
            unit_cost: 250000,
            amount: 500000,
            remarks: "Event 17 Des",
            due_date: new Date().toISOString().split('T')[0]
        },
        {
            id: crypto.randomUUID(),
            project_id: projectId || projects[0]?.id,
            project_name: projects.find(p => p.id === (projectId || projects[0]?.id))?.name,
            category: "Transport & Accomodation",
            sub_item: "E-toll",
            beneficiary: "E-toll",
            qty: 1,
            frequency: 2,
            unit_cost: 200000,
            amount: 400000,
            remarks: "",
            due_date: new Date().toISOString().split('T')[0]
        },
        {
            id: crypto.randomUUID(),
            project_id: projectId || projects[0]?.id,
            project_name: projects.find(p => p.id === (projectId || projects[0]?.id))?.name,
            category: "Other Support",
            sub_item: "Frame sertifikat",
            beneficiary: "Frame sertifikat",
            qty: 23,
            frequency: 1,
            unit_cost: 30000,
            amount: 690000,
            remarks: "",
            due_date: new Date().toISOString().split('T')[0]
        },
        // Dana Taktis Entry (AI Rule: Categorized as Other Support)
        {
            id: crypto.randomUUID(),
            project_id: projectId || projects[0]?.id,
            project_name: projects.find(p => p.id === (projectId || projects[0]?.id))?.name,
            category: "Other Support",
            sub_item: "Dana Taktis",
            beneficiary: "Dana Taktis (PIC)",
            qty: 1,
            frequency: 1,
            unit_cost: 1500000,
            amount: 1500000,
            remarks: "Cash pegangan/modal PIC (buffer)",
            due_date: new Date().toISOString().split('T')[0]
        }
    ];

    setItems(prev => [...prev, ...mockItems]);
    setIsAiLoading(false);
    toast.success("AI successfully extracted items (including Dana Taktis)!");
  };

  const handleAddItem = () => {
    if (!projectId || !subItem || !calculatedAmount) {
        toast.error("Please fill in Project, Item Name, and Cost details.");
        return;
    }

    const project = projects.find(p => p.id === projectId);

    const newItem: BatchExpenseItem = {
        id: crypto.randomUUID(),
        project_id: projectId,
        project_name: project?.name,
        beneficiary: subItem, // Using Sub Item as beneficiary/name
        sub_item: subItem,
        category,
        qty: parseFloat(qty),
        frequency: parseFloat(frequency),
        unit_cost: parseFloat(unitCost),
        amount: calculatedAmount,
        remarks,
        due_date: dueDate
    };

    setItems([...items, newItem]);
    
    // Reset fields
    setSubItem("");
    setUnitCost("");
    setRemarks("");
    // Keep project, category, qty, freq as they might be similar for next row
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const createExpensesMutation = useMutation({
    mutationFn: async (expenses: BatchExpenseItem[]) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const records = expenses.map(e => ({
            project_id: e.project_id,
            created_by: user.id,
            beneficiary: e.beneficiary,
            tf_amount: e.amount,
            status_expense: 'Proposed',
            remarks: e.remarks || e.category ? `${e.category ? `[${e.category}] ` : ''}${e.remarks}` : 'Operational Sheet Entry',
            due_date: e.due_date ? new Date(e.due_date).toISOString() : null,
            custom_properties: {
                source: 'operational_sheet',
                sheet_url: sheetUrl,
                category: e.category,
                sub_item: e.sub_item,
                qty: e.qty,
                frequency: e.frequency,
                unit_cost: e.unit_cost
            },
            // Auto-tagging based on category
            tags: e.category ? [{ name: e.category, color: '#64748b' }] : [] // Note: This structure depends on how tags are handled in your insert logic (usually relational)
        }));

        // Insert expenses (Note: Tags need separate handling usually, but we'll stick to basic insert for now)
        const { data: insertedExpenses, error } = await supabase.from('expenses').insert(records.map(r => {
            const { tags, ...rest } = r; // Remove tags from direct insert if simple insert
            return rest;
        })).select();
        
        if (error) throw error;

        // If you had tag logic, you'd insert expense_tags here using insertedExpenses ids.
        // Since this is a simple dialog, we will skip advanced tag relation creation for brevity unless requested.
    },
    onSuccess: () => {
        toast.success(`Successfully added ${items.length} expenses.`);
        setItems([]);
        setSheetUrl("");
        setEmbedUrl("");
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        onOpenChange(false);
    },
    onError: (err: any) => {
        toast.error("Failed to save expenses", { description: err.message });
    }
  });

  const handleSaveAll = () => {
    if (items.length === 0) return;
    createExpensesMutation.mutate(items);
  };

  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
            <div>
                <DialogTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    Operational Sheet Entry
                </DialogTitle>
                <DialogDescription className="hidden sm:block text-xs text-muted-foreground">
                    Embed your operational sheet or use AI to extract items.
                </DialogDescription>
            </div>
            <div className="flex items-center gap-2 w-full max-w-xl">
                <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input 
                    placeholder="Paste Google Sheet URL here..." 
                    value={sheetUrl}
                    onChange={handleSheetUrlChange}
                    className="flex-1 bg-background h-9 text-sm"
                />
                <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    onClick={handleAiExtraction}
                    disabled={isAiLoading || !sheetUrl}
                >
                    {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                    <span className="hidden sm:inline">AI Sync</span>
                </Button>
            </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left: Sheet Preview */}
            <div className="flex-1 bg-muted/10 border-r relative flex flex-col">
                {embedUrl ? (
                    <iframe 
                        src={embedUrl} 
                        className="w-full h-full border-none"
                        title="Google Sheet Preview"
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                        <FileSpreadsheet className="h-16 w-16 mb-4 opacity-20" />
                        <h3 className="font-semibold text-lg">No Sheet Loaded</h3>
                        <p className="max-w-md text-sm">Paste a Google Sheet URL above to preview it here while you input data.</p>
                    </div>
                )}
            </div>

            {/* Right: Data Entry & List */}
            <div className="w-full lg:w-[450px] flex flex-col bg-background shadow-lg z-10 border-l">
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

                        <Button onClick={handleAddItem} className="w-full h-8 text-xs" size="sm" variant="secondary">
                            <Plus className="h-3 w-3 mr-1" /> Add Entry
                        </Button>
                    </div>
                </div>

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
                                {items.map((item, idx) => (
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
                                                    onClick={() => handleRemoveItem(item.id)}
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

                <div className="p-4 border-t bg-background">
                    <Button 
                        className="w-full" 
                        onClick={handleSaveAll} 
                        disabled={items.length === 0 || createExpensesMutation.isPending}
                    >
                        {createExpensesMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Submit {items.length} Items
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}