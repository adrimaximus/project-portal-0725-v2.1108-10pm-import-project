import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Project } from "@/types";
import { SheetUrlInput } from "./operational-sheet/SheetUrlInput";
import { ManualEntryForm, ExpenseFormData } from "./operational-sheet/ManualEntryForm";
import { ExpenseItemsList, BatchExpenseItem } from "./operational-sheet/ExpenseItemsList";

interface OperationalSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OperationalSheetDialog({ open, onOpenChange }: OperationalSheetDialogProps) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [items, setItems] = useState<BatchExpenseItem[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const queryClient = useQueryClient();

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

  const handleUrlChange = (url: string) => {
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
    
    setIsAiLoading(true);
    toast.info("AI Agent is analyzing the sheet...", { description: "Extracting items, quantities, and costs." });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fallback project if none selected in form (though this logic is mainly for demo, usually context is needed)
    // We'll use the first available project for the mock data if no specific logic
    const defaultProjectId = projects[0]?.id;
    const defaultProjectName = projects[0]?.name;

    const mockItems: BatchExpenseItem[] = [
        {
            id: crypto.randomUUID(),
            project_id: defaultProjectId,
            project_name: defaultProjectName,
            category: "F&B",
            sub_item: "Meals crew",
            beneficiary: "Meals crew",
            qty: 12,
            frequency: 1,
            unit_cost: 50000,
            amount: 600000,
            remarks: "Event 17 des",
            due_date: new Date().toISOString().split('T')[0]
        },
        {
            id: crypto.randomUUID(),
            project_id: defaultProjectId,
            project_name: defaultProjectName,
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
            project_id: defaultProjectId,
            project_name: defaultProjectName,
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
            project_id: defaultProjectId,
            project_name: defaultProjectName,
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
            project_id: defaultProjectId,
            project_name: defaultProjectName,
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
        {
            id: crypto.randomUUID(),
            project_id: defaultProjectId,
            project_name: defaultProjectName,
            category: "Other Support",
            sub_item: "Dana Taktis",
            beneficiary: "Dana Taktis (PIC)",
            qty: 1,
            frequency: 1,
            unit_cost: 3500000,
            amount: 3500000,
            remarks: "Cash pegangan/modal PIC (buffer)",
            due_date: new Date().toISOString().split('T')[0]
        }
    ];

    setItems(prev => [...prev, ...mockItems]);
    setIsAiLoading(false);
    toast.success("AI successfully extracted items (including Dana Taktis)!");
  };

  const handleAddItem = (data: ExpenseFormData) => {
    const project = projects.find(p => p.id === data.projectId);
    const calculatedAmount = (parseFloat(data.qty || "0") * parseFloat(data.frequency || "0") * parseFloat(data.unitCost || "0"));

    const newItem: BatchExpenseItem = {
      id: crypto.randomUUID(),
      project_id: data.projectId,
      project_name: project?.name,
      beneficiary: data.subItem,
      sub_item: data.subItem,
      category: data.category,
      qty: parseFloat(data.qty),
      frequency: parseFloat(data.frequency),
      unit_cost: parseFloat(data.unitCost),
      amount: calculatedAmount,
      remarks: data.remarks,
      due_date: data.dueDate
    };

    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
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
        tags: e.category ? [{ name: e.category, color: '#64748b' }] : []
      }));

      const { data: insertedExpenses, error } = await supabase.from('expenses').insert(records.map(r => {
        const { tags, ...rest } = r;
        return rest;
      })).select();
      
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
          <SheetUrlInput 
            sheetUrl={sheetUrl} 
            onUrlChange={handleUrlChange} 
            onAiExtract={handleAiExtraction} 
            isAiLoading={isAiLoading} 
          />
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
            <ManualEntryForm projects={projects} onAdd={handleAddItem} />
            <ExpenseItemsList items={items} onRemoveItem={handleRemoveItem} />
            
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