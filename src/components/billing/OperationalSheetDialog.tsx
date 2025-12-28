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

  const fetchCsv = async (url: string) => {
      const { data, error } = await supabase.functions.invoke('proxy-google-sheet', { 
          body: { url } 
      });
      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      return data;
  };

  const processSheetUrl = async (url: string) => {
    if (!url) return;
    
    setIsAiLoading(true);
    const toastId = toast.loading("Syncing...", { description: "Reading sheet data..." });

    try {
        const timestamp = new Date().getTime();
        let baseUrl = "";
        let gid = "";

        try {
            const urlObj = new URL(url);
            gid = urlObj.searchParams.get("gid") || "";
            if (!gid && urlObj.hash.includes("gid=")) {
                gid = urlObj.hash.split("gid=")[1].split("&")[0];
            }
        } catch (e) {
            // ignore
        }

        if (url.includes("/d/e/")) {
            if (url.includes("/pubhtml")) {
              baseUrl = url.replace("/pubhtml", `/pub?output=csv&t=${timestamp}`);
            } else if (url.includes("/pub")) {
              const urlObj = new URL(url);
              urlObj.searchParams.set("output", "csv");
              urlObj.searchParams.set("t", String(timestamp));
              if (gid) urlObj.searchParams.set("gid", gid);
              baseUrl = urlObj.toString();
            } else {
              baseUrl = `${url.replace(/\/$/, "")}/pub?output=csv&t=${timestamp}`;
            }
        } else {
            const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (match && match[1]) {
                baseUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&t=${timestamp}`;
            }
        }

        if (!baseUrl) {
             if (!url.toLowerCase().endsWith('csv')) {
                 throw new Error("Invalid Google Sheet URL format");
             }
             baseUrl = url;
        }

        let csvText = "";
        
        if (gid) {
            csvText = await fetchCsv(`${baseUrl}&gid=${gid}`);
        } else if (!baseUrl.includes("/d/e/")) { 
            try {
                csvText = await fetchCsv(`${baseUrl}&sheet=Ajuan`);
            } catch (e) {
                toast.info("Tab 'Ajuan' not found", { id: toastId, description: "Fetching the first tab instead." });
                csvText = await fetchCsv(baseUrl);
            }
        } else {
             csvText = await fetchCsv(baseUrl);
        }

        if (!csvText || typeof csvText !== 'string') {
            throw new Error("Received empty data from sheet.");
        }

        if (csvText.trim().startsWith("<!DOCTYPE html") || csvText.includes("<html")) {
            throw new Error("Sheet is likely private. Please set access to 'Anyone with the link' can View.");
        }

        Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
                const rawData = results.data as string[][];
                
                if (rawData.length === 0) {
                    toast.warning("Sheet is empty", { id: toastId });
                    return;
                }

                let headerRowIndex = -1;
                const headerKeywords = [
                    'items', 'item', 'uraian', 'deskripsi', 'description', 'keterangan', 'nama barang', 'keperluan', 
                    'sub items', 'sub item',
                    'qty', 'jumlah', 'vol', 'volume', 
                    'freq', 'frequency', 'days', 'hari', 
                    'harga', 'price', 'cost', 'satuan', 'unit cost',
                    'total', 'amount', 'jumlah harga', 'sub-total', 'sub total'
                ];

                for (let i = 0; i < Math.min(rawData.length, 10); i++) {
                    const rowStr = rawData[i].join(' ').toLowerCase();
                    const matches = headerKeywords.filter(keyword => rowStr.includes(keyword));
                    if (matches.length >= 2) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    console.warn("Could not auto-detect header row. Defaulting to row 0.");
                    headerRowIndex = 0;
                }

                const headers = rawData[headerRowIndex].map(h => h.trim());
                const dataRows = rawData.slice(headerRowIndex + 1);

                // Helper to safely get value by index or key
                const getValue = (row: any, keys: string[], fallbackIndex?: number) => {
                    // 1. Try matching by key
                    for (const key of keys) {
                        if (row[key] !== undefined && row[key] !== '') return row[key];
                    }
                    // 2. Try matching by index if 'row' is an array-like or object indexed by column names
                    if (fallbackIndex !== undefined) {
                         const headerName = headers[fallbackIndex];
                         if (headerName && row[headerName] !== undefined) return row[headerName];
                    }
                    return undefined;
                };

                const parsedData = dataRows.map(row => {
                    const obj: any = {};
                    headers.forEach((header, index) => {
                        if (header) {
                            obj[header] = row[index];
                        }
                    });
                    return obj;
                });

                console.log("Parsed Headers:", headers);

                const defaultProjectId = projects[0]?.id;
                const defaultProjectName = projects[0]?.name;
                
                // Variable to hold the last seen category for fill-down
                let lastCategory = 'General';

                const mappedItems: BatchExpenseItem[] = parsedData.map((rawRow) => {
                    const row: Record<string, any> = {};
                    Object.keys(rawRow).forEach(key => {
                        row[key.toLowerCase().trim()] = rawRow[key];
                    });

                    // 1. CATEGORY / ITEMS (Column A - Index 0)
                    // In the screenshot, Column A is "ITEMS" which acts as Category
                    let category = getValue(row, ['items', 'category', 'kategori', 'cat', 'pos', 'divisi'], 0);
                    
                    if (category && category.trim() !== '') {
                        lastCategory = category;
                    } else {
                        category = lastCategory; // Fill down
                    }

                    // 2. ITEM NAME / SUB ITEMS (Column B - Index 1)
                    // In the screenshot, Column B is "SUB ITEMS"
                    const subItem = getValue(row, ['sub items', 'sub item', 'item', 'name', 'description', 'deskripsi', 'uraian', 'keterangan', 'nama barang', 'beneficiary', 'keperluan'], 1) || 'Unknown Item';
                    
                    const beneficiary = row['beneficiary'] || row['penerima'] || row['vendor'] || row['suplier'] || row['toko'] || subItem;
                    
                    // 3. QTY (Column C - Index 2)
                    let qty = parseNumber(getValue(row, ['qty', 'quantity', 'jumlah', 'vol', 'volume'], 2) || '1');
                    if (qty === 0) qty = 1; 
                    
                    // 4. FREQ (Column D - Index 3)
                    let freq = parseNumber(getValue(row, ['freq', 'frequency', 'days', 'hari', 'durasi'], 3) || '1');
                    if (isNaN(freq)) freq = 1;

                    // 5. UNIT COST (Column E - Index 4)
                    let cost = parseNumber(getValue(row, ['unit cost', 'cost', 'price', 'harga', 'satuan', 'harga satuan'], 4) || '0');

                    // 6. SUB-TOTAL (Column F - Index 5)
                    let amount = parseNumber(getValue(row, ['sub-total', 'sub total', 'amount', 'total', 'jumlah harga', 'total harga'], 5) || '0');
                    
                    if ((amount === 0 || isNaN(amount)) && cost > 0) {
                        amount = qty * freq * cost;
                    }
                    if ((cost === 0 || isNaN(cost)) && amount > 0) {
                        cost = amount / (qty * freq);
                    }

                    const remarks = row['remarks'] || row['notes'] || row['catatan'] || row['note'] || '';
                    const date = row['date'] || row['tanggal'] || row['tgl'] || new Date().toISOString().split('T')[0];
                    
                    // Note: project_name mapping removed as it's not in the screenshot columns A-F.
                    // We will use the default project selected in the dialog or context.
                    
                    return {
                        id: crypto.randomUUID(),
                        project_id: defaultProjectId,
                        project_name: category, // Using category as project_name for the badge in UI as requested
                        category: category,
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
                    toast.error("No valid items found", { 
                        id: toastId, 
                        description: `Headers found: ${headers.join(", ")}. Ensure headers like 'Item' and 'Harga' or 'Sub-Total' are present.` 
                    });
                } else {
                    setItems(prevItems => {
                        const manualItems = prevItems.filter(item => item.isManual);
                        return [...manualItems, ...mappedItems];
                    });
                    
                    toast.success("Synced!", { 
                        id: toastId, 
                        description: `${mappedItems.length} items loaded (Header found at row ${headerRowIndex + 1}).` 
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

  const handleUpdateItem = (id: string, updates: Partial<BatchExpenseItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        // Auto-recalculate total if components change
        if (updates.qty !== undefined || updates.frequency !== undefined || updates.unit_cost !== undefined) {
            updatedItem.amount = (updatedItem.qty || 0) * (updatedItem.frequency || 0) * (updatedItem.unit_cost || 0);
        }
        return updatedItem;
      }
      return item;
    }));
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

            <ExpenseItemsList 
              items={items} 
              onRemoveItem={handleRemoveItem} 
              onUpdateItem={handleUpdateItem}
            />
            
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