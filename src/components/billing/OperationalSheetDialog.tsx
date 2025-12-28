import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, FileSpreadsheet, Save, Link as LinkIcon, Loader2 } from "lucide-react";
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
  beneficiary: string;
  amount: number;
  remarks: string;
  due_date: string;
};

export default function OperationalSheetDialog({ open, onOpenChange }: OperationalSheetDialogProps) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [items, setItems] = useState<BatchExpenseItem[]>([]);
  const queryClient = useQueryClient();

  // Form State
  const [projectId, setProjectId] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
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

  const handleSheetUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setSheetUrl(url);
    
    // Simple converter to embed URL
    // e.g., https://docs.google.com/spreadsheets/d/KEY/edit... -> https://docs.google.com/spreadsheets/d/KEY/preview
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

  const handleAddItem = () => {
    if (!projectId || !beneficiary || !amount) {
        toast.error("Please fill in Project, Beneficiary, and Amount.");
        return;
    }

    const project = projects.find(p => p.id === projectId);

    const newItem: BatchExpenseItem = {
        id: crypto.randomUUID(),
        project_id: projectId,
        project_name: project?.name,
        beneficiary,
        amount: parseFloat(amount),
        remarks,
        due_date: dueDate
    };

    setItems([...items, newItem]);
    
    // Reset fields for next entry (keep project selected for convenience)
    setBeneficiary("");
    setAmount("");
    setRemarks("");
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
            status_expense: 'Proposed', // Default status for sheet entries
            remarks: `${e.remarks} (via Operational Sheet)`,
            due_date: e.due_date ? new Date(e.due_date).toISOString() : null,
            custom_properties: {
                source: 'operational_sheet',
                sheet_url: sheetUrl
            }
        }));

        const { error } = await supabase.from('expenses').insert(records);
        if (error) throw error;
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
                <DialogDescription className="hidden sm:block">
                    View your operational sheet and input expenses in batch.
                </DialogDescription>
            </div>
            <div className="flex items-center gap-2 w-full max-w-xl">
                <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input 
                    placeholder="Paste Google Sheet URL here..." 
                    value={sheetUrl}
                    onChange={handleSheetUrlChange}
                    className="flex-1 bg-background"
                />
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
                        <p className="max-w-md">Paste a Google Sheet URL above to preview it here while you input data.</p>
                    </div>
                )}
            </div>

            {/* Right: Data Entry & List */}
            <div className="w-full lg:w-[450px] flex flex-col bg-background shadow-lg z-10">
                <div className="p-4 border-b space-y-4 bg-card">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">New Entry</h3>
                    
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Project</Label>
                            <Select value={projectId} onValueChange={setProjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Beneficiary</Label>
                                <Input 
                                    value={beneficiary} 
                                    onChange={e => setBeneficiary(e.target.value)} 
                                    placeholder="Who to pay?"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Amount (IDR)</Label>
                                <Input 
                                    type="number"
                                    value={amount} 
                                    onChange={e => setAmount(e.target.value)} 
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Date</Label>
                                <Input 
                                    type="date"
                                    value={dueDate} 
                                    onChange={e => setDueDate(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Remarks</Label>
                                <Input 
                                    value={remarks} 
                                    onChange={e => setRemarks(e.target.value)} 
                                    placeholder="Details..."
                                />
                            </div>
                        </div>

                        <Button onClick={handleAddItem} className="w-full" size="sm">
                            <Plus className="h-4 w-4 mr-2" /> Add to List
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-muted/5">
                    <div className="p-3 border-b flex justify-between items-center bg-muted/20">
                        <span className="text-sm font-medium">Items to Add ({items.length})</span>
                        <Badge variant="outline" className="font-mono">
                            Total: {new Intl.NumberFormat('id-ID').format(totalAmount)}
                        </Badge>
                    </div>
                    
                    <ScrollArea className="flex-1 p-3">
                        {items.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm italic">
                                Added items will appear here.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item, idx) => (
                                    <Card key={item.id} className="text-sm">
                                        <CardContent className="p-3 flex justify-between items-start gap-2">
                                            <div className="space-y-1 overflow-hidden">
                                                <div className="font-medium truncate">{item.beneficiary}</div>
                                                <div className="text-xs text-muted-foreground truncate">{item.project_name}</div>
                                                {item.remarks && <div className="text-xs text-muted-foreground truncate opacity-80">{item.remarks}</div>}
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className="font-mono font-medium">
                                                    {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(item.amount)}
                                                </span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
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
                        Save {items.length} Expenses
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}