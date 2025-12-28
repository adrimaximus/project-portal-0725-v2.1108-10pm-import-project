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
    
    // Remove "Rp" or "IDR" symbols
    const cleanStr = str.replace(/^(rp|idr)\.?\s*/i, '');
    
    // IDR format often uses dot as thousands separator and comma as decimal (1.000.000,00)
    // US format uses comma as thousands and dot as decimal (1,000,000.00)
    
    // Check if it looks like IDR format (contains dots but no commas, or dots appearing before commas)
    const lastDotIndex = cleanStr.lastIndexOf('.');
    const lastCommaIndex = cleanStr.lastIndexOf(',');
    
    let normalized = cleanStr;

    if (lastDotIndex > lastCommaIndex && lastCommaIndex === -1) {
        // Like "1.000.000" (no comma) -> remove dots
        // CAUTION: Could be "10.5" (US decimal). Heuristic: multiple dots usually mean thousands.
        if ((cleanStr.match(/\./g) || []).length > 1) {
             normalized = cleanStr.replace(/\./g, '');
        } else {
             // Single dot. "1000" vs "1.5". If it has 3 digits after dot, assume thousand separator? 
             // risky. Let's assume Indonesia locale priority if ambiguous.
             // Actually, safer to strip non-digits if we assume integer amounts for expenses usually
        }
    } else if (lastCommaIndex > -1) {
        // Like "1.000,00" or "1000,50" -> remove dots, replace comma with dot
        normalized = cleanStr.replace(/\./g, '').replace(',', '.');
    }

    // Final fallback cleanup: keep only numbers, dot, minus
    const finalClean = normalized.replace(/[^0-9.-]/g, '');
    const floatVal = parseFloat(finalClean);
    
    return isNaN(floatVal) ? 0 : floatVal;
  };

  const processSheetUrl = async (url: string) => {
    if (!url) return;
    
    setIsAiLoading(true);
    const toastId = toast.loading("Syncing...", { description: "Connecting to Google Sheet..." });

    try {
        const timestamp = new Date().getTime();
        let exportUrl = "";
        let gid = "";

        // Extract GID
        try {
            const urlObj = new URL(url);
            gid = urlObj.searchParams.get("gid") || "";
            // Handle #gid=12345
            if (!gid && urlObj.hash.includes("gid=")) {
                gid = urlObj.hash.split("gid=")[1].split("&")[0];
            }
        } catch (e) {
            // ignore invalid URL structure initially
        }

        if (url.includes("/d/e/")) {
            // Published to web links
            if (url.includes("/pubhtml")) {
              exportUrl = url.replace("/pubhtml", `/pub?output=csv&t=${timestamp}`);
            } else if (url.includes("/pub")) {
              const urlObj = new URL(url);
              urlObj.searchParams.set("output", "csv");
              urlObj.searchParams.set("t", String(timestamp));
              if (gid) urlObj.searchParams.set("gid", gid);
              exportUrl = urlObj.toString();
            } else {
              exportUrl = `${url.replace(/\/$/, "")}/pub?output=csv&t=${timestamp}`;
            }
        } else {
            // Standard edit URL
            const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (match && match[1]) {
                exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&t=${timestamp}`;
                if (gid) {
                    exportUrl += `&gid=${gid}`;
                } else {
                    toast.info("No specific tab selected (GID missing).", { 
                        description: "Exporting the first tab. Navigate to the 'Ajuan' tab and copy the URL if this is incorrect.",
                        duration: 5000 
                    });
                }
            }
        }

        if (!exportUrl) {
             if (!url.toLowerCase().endsWith('csv')) {
                 throw new Error("Invalid Google Sheet URL format");
             }
             exportUrl = url;
        }

        console.log("Fetching CSV from:", exportUrl);

        const { data: csvText, error } = await supabase.functions.invoke('proxy-google-sheet', { 
            body: { url: exportUrl } 
        });

        if (error) throw error;
        
        if (!csvText || typeof csvText !== 'string') {
            throw new Error("Received empty data from sheet.");
        }

        if (csvText.trim().startsWith("<!DOCTYPE html") || csvText.includes("<html")) {
            throw new Error("Sheet is likely private. Please set access to 'Anyone with the link' can View.");
        }

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedData = results.data as any[];
                
                if (parsedData.length === 0) {
                    toast.warning("Sheet is empty", { id: toastId });
                    return;
                }

                // Check available headers for debugging
                const headers = Object.keys(parsedData[0]).map(h => h.toLowerCase().trim());
                console.log("Found CSV Headers:", headers);

                const defaultProjectId = projects[0]?.id;
                const defaultProjectName = projects[0]?.name;

                const mappedItems: BatchExpenseItem[] = parsedData.map((rawRow) => {
                    // Create a normalized row object where keys are lowercase and trimmed
                    const row: Record<string, any> = {};
                    Object.keys(rawRow).forEach(key => {
                        row[key.toLowerCase().trim()] = rawRow[key];
                    });

                    // Flexible column matching with Indonesian support
                    const category = row['category'] || row['kategori'] || row['cat'] || row['pos'] || row['divisi'] || 'General';
                    
                    const subItem = row['item'] || row['sub item'] || row['name'] || row['description'] || row['deskripsi'] || row['uraian'] || row['keterangan'] || row['nama barang'] || row['beneficiary'] || row['keperluan'] || 'Unknown Item';
                    
                    const beneficiary = row['beneficiary'] || row['penerima'] || row['vendor'] || row['suplier'] || row['toko'] || subItem;
                    
                    let qty = parseNumber(row['qty'] || row['quantity'] || row['jumlah'] || row['vol'] || row['volume'] || '1');
                    if (qty === 0) qty = 1; // Default to 1 if missing/0
                    
                    let freq = parseNumber(row['freq'] || row['frequency'] || '1');
                    if (freq === 0) freq = 1;

                    let cost = parseNumber(row['cost'] || row['price'] || row['harga'] || row['satuan'] || row['unit cost'] || row['harga satuan'] || '0');

                    let amount = parseNumber(row['amount'] || row['total'] || row['jumlah harga'] || row['total harga'] || '0');
                    
                    // Auto-calculate if amount is missing but cost exists
                    if ((amount === 0 || isNaN(amount)) && cost > 0) {
                        amount = qty * freq * cost;
                    }
                    
                    // Auto-calculate cost if amount exists but cost is missing
                    if ((cost === 0 || isNaN(cost)) && amount > 0) {
                        cost = amount / (qty * freq);
                    }

                    const remarks = row['remarks'] || row['notes'] || row['catatan'] || row['note'] || '';
                    const date = row['date'] || row['tanggal'] || row['tgl'] || new Date().toISOString().split('T')[0];
                    
                    const rowProjectName = row['project'] || row['proyek'];
                    let projectId = defaultProjectId;
                    let projectName = defaultProjectName;
                    
                    if (rowProjectName) {
                        const foundProject = projects.find(p => p.name.toLowerCase().includes(rowProjectName.toLowerCase()));
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
                }).filter(item => (item.amount > 0 || item.unit_cost > 0));

                if (mappedItems.length === 0) {
                    const headerList = Object.keys(parsedData[0]).join(", ");
                    toast.error("No valid items found", { 
                        id: toastId, 
                        description: `Columns found: ${headerList}. Expecting: Item/Uraian, Harga/Amount.` 
                    });
                } else {
                    setItems(prevItems => {
                        const manualItems = prevItems.filter(item => item.isManual);
                        return [...manualItems, ...mappedItems];
                    });
                    
                    toast.success("Synced!", { 
                        id: toastId, 
                        description: `${mappedItems.length} items loaded.` 
                    });
                }
            },
            error: (err) => {
                console.error("CSV Parse Error", err);
                toast.error("Failed to parse sheet data", { id: toastId });
            }
        });

    } catch (error: any) {
        console.error("Sheet processing failed:", error);
        toast.error("Sync Failed", { 
            id: toastId, 
            description: error.message || "Could not fetch sheet data." 
        });
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setSheetUrl(url);
    try {
      if (url.includes("docs.google.com/spreadsheets")) {
        const urlObj = new URL(url);
        const baseUrl = url.split("/edit")[0];
        let embed = `${baseUrl}/preview?widget=true&headers=false`;
        
        // Extract GID for embed preview
        const gid = urlObj.searchParams.get("gid") || (urlObj.hash.includes("gid=") ? urlObj.hash.split("gid=")[1].split("&")[0] : "");
        if (gid) {
            embed += `&gid=${gid}`;
        }
        setEmbedUrl(embed);
      } else {
        setEmbedUrl("");
      }
    } catch {
      setEmbedUrl("");
    }
  };

  const handleRefreshEmbed = () => {
    if (!sheetUrl) return;
    const timestamp = new Date().getTime();
    if (sheetUrl.includes("docs.google.com/spreadsheets")) {
        handleUrlChange(sheetUrl);
        setTimeout(() => {
            setEmbedUrl(prev => prev.includes('?') ? prev + `&t=${timestamp}` : prev + `?t=${timestamp}`);
        }, 50);
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