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
import Papa from "papaparse";

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

  const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const str = String(value).trim();
    
    if (str.toLowerCase().includes('rp')) {
        return parseFloat(str.replace(/\D/g, '')) || 0;
    }

    const clean = str.replace(/[^0-9.,-]/g, '');
    if (/^-?\d+$/.test(clean)) return parseFloat(clean);

    if (clean.includes('.') && !clean.includes(',')) {
        if (/\.\d{3}$/.test(clean) || /\.\d{3}\./.test(clean)) {
             return parseFloat(clean.replace(/\./g, ''));
        }
        return parseFloat(clean);
    }

    if (!clean.includes('.') && clean.includes(',')) {
        if (clean.split(',').length === 2 && clean.split(',')[1].length <= 2) {
             return parseFloat(clean.replace(',', '.'));
        }
        return parseFloat(clean.replace(/,/g, ''));
    }

    if (clean.indexOf('.') < clean.indexOf(',')) {
        return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    }

    return parseFloat(clean.replace(/,/g, ''));
  };

  const processSheetUrl = async (url: string) => {
    if (!url) return;
    
    setIsAiLoading(true);
    const toastId = toast.loading("Syncing with sheet...", { description: "Reading latest data..." });

    try {
        const timestamp = new Date().getTime();
        let exportUrl = "";

        if (url.includes("/d/e/")) {
            if (url.includes("/pubhtml")) {
              exportUrl = url.replace("/pubhtml", `/pub?output=csv&t=${timestamp}`);
            } else if (url.includes("/pub")) {
              const urlObj = new URL(url);
              urlObj.searchParams.set("output", "csv");
              urlObj.searchParams.set("t", String(timestamp));
              exportUrl = urlObj.toString();
            } else {
              exportUrl = `${url.replace(/\/$/, "")}/pub?output=csv&t=${timestamp}`;
            }
        } else {
            const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (match && match[1]) {
                exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&t=${timestamp}`;
            }
        }

        if (!exportUrl) {
             if (!url.toLowerCase().endsWith('csv')) {
                 throw new Error("Invalid Google Sheet URL format");
             }
             exportUrl = url;
        }

        const { data: csvText, error } = await supabase.functions.invoke('proxy-google-sheet', { 
            body: { url: exportUrl } 
        });

        if (error) throw error;
        if (!csvText || typeof csvText !== 'string') throw new Error("Empty response from sheet");

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedData = results.data as any[];
                
                const defaultProjectId = projects[0]?.id;
                const defaultProjectName = projects[0]?.name;

                const mappedItems: BatchExpenseItem[] = parsedData.map((row) => {
                    const category = row['Category'] || row['Kategori'] || row['Cat'] || 'General';
                    const subItem = row['Item'] || row['Sub Item'] || row['Name'] || row['Description'] || row['Beneficiary'] || 'Unknown Item';
                    const beneficiary = row['Beneficiary'] || row['Penerima'] || subItem;
                    
                    let qty = parseNumber(row['Qty'] || row['Quantity'] || row['Jumlah'] || '1');
                    if (isNaN(qty)) qty = 1;
                    
                    let freq = parseNumber(row['Freq'] || row['Frequency'] || '1');
                    if (isNaN(freq)) freq = 1;

                    let cost = parseNumber(row['Cost'] || row['Price'] || row['Harga'] || row['Unit Cost'] || '0');
                    if (isNaN(cost)) cost = 0;

                    let amount = parseNumber(row['Amount'] || row['Total'] || '0');
                    if (isNaN(amount) || amount === 0) {
                        amount = qty * freq * cost;
                    }

                    const remarks = row['Remarks'] || row['Notes'] || row['Keterangan'] || '';
                    const date = row['Date'] || row['Tanggal'] || new Date().toISOString().split('T')[0];
                    
                    const rowProjectName = row['Project'] || row['Proyek'];
                    let projectId = defaultProjectId;
                    let projectName = defaultProjectName;
                    
                    if (rowProjectName) {
                        const foundProject = projects.find(p => p.name.toLowerCase() === rowProjectName.toLowerCase());
                        if (foundProject) {
                            projectId = foundProject.id;
                            projectName = foundProject.name;
                        }
                    }

                    return {
                        id: crypto.randomUUID(),
                        project_id: projectId,
                        project_name: projectName,
                        category,
                        sub_item: subItem,
                        beneficiary,
                        qty,
                        frequency: freq,
                        unit_cost: cost,
                        amount,
                        remarks,
                        due_date: date,
                        isManual: false
                    };
                }).filter(item => item.amount > 0 || item.sub_item !== 'Unknown Item');

                setItems(prevItems => {
                    const manualItems = prevItems.filter(item => item.isManual);
                    return [...manualItems, ...mappedItems];
                });
                
                toast.success("Synced!", { id: toastId, description: `${mappedItems.length} items loaded from sheet.` });
            },
            error: (err) => {
                console.error("CSV Parse Error", err);
                toast.error("Failed to parse sheet data", { id: toastId });
            }
        });

    } catch (error: any) {
        console.error("Sheet processing failed:", error);
        toast.error("Sync Failed", { id: toastId, description: "Could not fetch sheet data. Please check permissions." });
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setSheetUrl(url);
    try {
      if (url.includes("docs.google.com/spreadsheets")) {
        const baseUrl = url.split("/edit")[0];
        setEmbedUrl(`${baseUrl}/preview?widget=true&headers=false`);
        // Auto-sync disabled on input change to prevent spam, manual trigger needed
      } else {
        setEmbedUrl("");
      }
    } catch {
      setEmbedUrl("");
    }
  };

  const handleRefreshEmbed = () => {
    if (!sheetUrl) return;
    
    // Force iframe reload with timestamp
    const timestamp = new Date().getTime();
    if (sheetUrl.includes("docs.google.com/spreadsheets")) {
        const baseUrl = sheetUrl.split("/edit")[0];
        setEmbedUrl(""); 
        setTimeout(() => {
            setEmbedUrl(`${baseUrl}/preview?widget=true&headers=false&t=${timestamp}`);
        }, 100);
    }
    toast.info("Refreshed embed view");
  };

  const handleSyncData = () => {
    processSheetUrl(sheetUrl);
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
      due_date: data.dueDate,
      isManual: true
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
          source: e.isManual ? 'manual_entry' : 'operational_sheet',
          sheet_url: e.isManual ? null : sheetUrl,
          category: e.category,
          sub_item: e.sub_item,
          qty: e.qty,
          frequency: e.frequency,
          unit_cost: e.unit_cost
        },
        tags: []
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

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

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
            onRefreshEmbed={handleRefreshEmbed}
            onSyncData={handleSyncData}
            isAiLoading={isAiLoading} 
          />
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 bg-muted/10 border-r relative flex flex-col min-h-[300px]">
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

          <div className="w-full lg:w-[450px] flex flex-col bg-background shadow-lg z-10 border-l">
            <ManualEntryForm projects={projects} onAdd={handleAddItem} />
            
            <div className="bg-muted/20 px-4 py-2 text-xs font-medium text-muted-foreground flex justify-between border-b">
              <span>{items.length} Items</span>
              <span>Total: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalAmount)}</span>
            </div>

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