import { useState, useRef, useMemo, useEffect } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Info, PlayCircle, UploadCloud, MessageSquare, Bell, FileSpreadsheet, X, Link as LinkIcon, File, CheckCircle2, Loader2, Send, RefreshCw, FlaskConical, Bot, Sparkles, Clock, AlertCircle, Download, Save, Wand2, Scaling, Trash2, FolderOpen, ListFilter, Search, Plus, Crown, ShieldCheck } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import InteractiveText from "@/components/InteractiveText";
import { PublicationCampaign } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Helper component for multi-select
import { MultiSelect } from "@/components/ui/multi-select";

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper component for auto-sizing cell textarea
const CellTextarea = ({ value, onChange, className, ...props }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={className}
      rows={1}
      {...props}
    />
  );
};

// Helper functions moved outside component to avoid redeclaration issues and ensure consistency
const normalizePhone = (p: string | number) => {
  // Convert to string
  let phone = String(p);
  
  // Remove ALL non-numeric characters (including =, +, spaces, -, etc.)
  // This handles input like "=+62 855-7805-194" -> "628557805194"
  phone = phone.replace(/\D/g, ''); 
  
  // Apply prefix rules
  if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1); // Replace leading 0 with 62 (08xx -> 628xx)
  } else if (phone.startsWith('8')) {
      phone = '62' + phone; // Add 62 if starts with 8 (8xx -> 628xx)
  }
  // If starts with 62, it remains as is (62xx -> 62xx)
  
  return phone;
};

const processImportedData = (rows: any[], headers: string[]) => {
  const phoneKeywords = ['phone', 'mobile', 'wa', 'whatsapp', 'telp', 'hp', 'nomor', 'contact'];
  const phoneColumns = headers.filter(h => 
      phoneKeywords.some(keyword => h.toLowerCase().includes(keyword))
  );

  // If no obvious phone columns, return as is
  if (phoneColumns.length === 0) return rows;

  return rows.map(row => {
      const newRow = { ...row };
      phoneColumns.forEach(col => {
          if (newRow[col] !== undefined && newRow[col] !== null) {
              newRow[col] = normalizePhone(newRow[col]);
          }
      });
      return newRow;
  });
};

// Helper to parse range string like "1-50, 60" into 0-based indices
const getIndicesFromRange = (range: string, totalRows: number): number[] => {
  if (!range.trim()) {
    // If empty, return all indices
    return Array.from({ length: totalRows }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = range.split(',');

  parts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr);
      const end = parseInt(endStr);
      
      if (!isNaN(start) && !isNaN(end)) {
        // User inputs 1-based, convert to 0-based
        const min = Math.max(0, Math.min(start, end) - 1);
        const max = Math.min(totalRows - 1, Math.max(start, end) - 1);
        
        for (let i = min; i <= max; i++) {
          indices.add(i);
        }
      }
    } else {
      const idx = parseInt(trimmed);
      if (!isNaN(idx)) {
        const i = idx - 1;
        if (i >= 0 && i < totalRows) {
          indices.add(i);
        }
      }
    }
  });

  return Array.from(indices).sort((a, b) => a - b);
};

const PublicationPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("whatsapp");
  
  // WhatsApp State - Initialized from localStorage
  const [data, setData] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("publication_data");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load data from local storage", e);
      return [];
    }
  });
  const [headers, setHeaders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("publication_headers");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [fileName, setFileName] = useState<string | null>(() => {
    return localStorage.getItem("publication_fileName") || null;
  });
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState<string>(() => {
    return localStorage.getItem("publication_phoneColumn") || "";
  });
  const [googleSheetUrl, setGoogleSheetUrl] = useState(() => {
    return localStorage.getItem("publication_googleSheetUrl") || "";
  });
  const [isDragging, setIsDragging] = useState(false);
  const [templateMessage, setTemplateMessage] = useState(() => {
    return localStorage.getItem("publication_templateMessage") || "";
  });
  const [isImporting, setIsImporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingSheet, setIsUpdatingSheet] = useState(false);
  const [messageType, setMessageType] = useState("text");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"fixed" | "dynamic">("fixed");
  const [fixedScheduleDate, setFixedScheduleDate] = useState("");
  const [fixedTimezone, setFixedTimezone] = useState("UTC");
  const [dynamicDateCol, setDynamicDateCol] = useState("");
  const [dynamicTimeCol, setDynamicTimeCol] = useState("same_as_date");
  const [rowRange, setRowRange] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [vipMode, setVipMode] = useState(false);
  
  // Resend Confirmation State
  const [confirmResendOpen, setConfirmResendOpen] = useState(false);
  const [duplicateRows, setDuplicateRows] = useState<number[]>([]);
  const [pendingRangeIndices, setPendingRangeIndices] = useState<number[]>([]);
  
  // Campaign State
  const [saveCampaignOpen, setSaveCampaignOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Table View State
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [resizingCol, setResizingCol] = useState<{ header: string; startX: number; startWidth: number } | null>(null);
  const [rowDensity, setRowDensity] = useState<"compact" | "normal" | "spacious">("spacious");

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: 'row' | 'header';
    targetIndex?: number;
    targetHeader?: string;
  } | null>(null);

  // AI Rewrite State
  const [aiInstructions, setAiInstructions] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // In-App Notification State
  const [notifTarget, setNotifTarget] = useState<"all" | "role" | "specific">("all");
  const [notifRole, setNotifRole] = useState("");
  const [notifUsers, setNotifUsers] = useState<string[]>([]);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifLink, setNotifLink] = useState("");
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const notifBodyRef = useRef<HTMLTextAreaElement>(null);

  // Effects to persist state to local storage
  useEffect(() => {
    try {
      localStorage.setItem("publication_data", JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save data to local storage (quota exceeded?)", e);
      // Optionally warn user if data is too large
    }
  }, [data]);

  useEffect(() => {
    localStorage.setItem("publication_headers", JSON.stringify(headers));
  }, [headers]);

  useEffect(() => {
    if (fileName) localStorage.setItem("publication_fileName", fileName);
    else localStorage.removeItem("publication_fileName");
  }, [fileName]);

  useEffect(() => {
    localStorage.setItem("publication_phoneColumn", selectedPhoneColumn);
  }, [selectedPhoneColumn]);

  useEffect(() => {
    localStorage.setItem("publication_googleSheetUrl", googleSheetUrl);
  }, [googleSheetUrl]);

  useEffect(() => {
    localStorage.setItem("publication_templateMessage", templateMessage);
  }, [templateMessage]);

  // Resize effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingCol) return;
      const diff = e.clientX - resizingCol.startX;
      const newWidth = Math.max(100, resizingCol.startWidth + diff);
      setColWidths(prev => ({ ...prev, [resizingCol.header]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizingCol(null);
      document.body.style.cursor = 'default';
    };

    if (resizingCol) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Fetch data for In-App selectors
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await supabase.from('roles').select('name');
      return data?.map(r => r.name) || [];
    }
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles_min'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, first_name, last_name, email');
      return data?.map(p => ({
        label: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'Unknown',
        value: p.id
      })) || [];
    }
  });

  // Fetch saved campaigns
  const { data: savedCampaigns = [], isLoading: isLoadingCampaigns } = useQuery<PublicationCampaign[]>({
    queryKey: ['publication_campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publication_campaigns')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // WhatsApp Handlers (Existing)
  const handleFile = (file: File) => {
    setFileName(file.name);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data as any[];
          if (parsedData.length > 0) {
            const headers = Object.keys(parsedData[0]);
            const normalizedData = processImportedData(parsedData, headers);
            setHeaders(headers);
            setData(normalizedData);
            
            // Auto-select phone column if possible
            const likelyPhoneCol = headers.find(h => 
                ['phone', 'mobile', 'wa', 'whatsapp', 'telp', 'hp'].some(k => h.toLowerCase().includes(k))
            );
            if (likelyPhoneCol) setSelectedPhoneColumn(likelyPhoneCol);

            toast.success("File uploaded", { description: `Successfully parsed ${parsedData.length} rows.` });
            setShowDuplicatesOnly(false);
          }
        },
        error: (error) => {
          toast.error("Error", { description: "Failed to parse CSV file." });
        }
      });
    } else if (['xls', 'xlsx'].includes(fileExtension || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          const headers = Object.keys(jsonData[0] as object);
          const normalizedData = processImportedData(jsonData, headers);
          setHeaders(headers);
          setData(normalizedData);

          // Auto-select phone column if possible
          const likelyPhoneCol = headers.find(h => 
            ['phone', 'mobile', 'wa', 'whatsapp', 'telp', 'hp'].some(k => h.toLowerCase().includes(k))
          );
          if (likelyPhoneCol) setSelectedPhoneColumn(likelyPhoneCol);

          toast.success("File uploaded", { description: `Successfully parsed ${jsonData.length} rows.` });
          setShowDuplicatesOnly(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error("Invalid file type", { description: "Please upload a CSV, XLS, or XLSX file." });
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };

  const handleGoogleSheetImport = async () => {
    let exportUrl = "";
    if (googleSheetUrl.includes("/d/e/")) {
      if (googleSheetUrl.includes("/pubhtml")) exportUrl = googleSheetUrl.replace("/pubhtml", "/pub?output=csv");
      else if (googleSheetUrl.includes("/pub")) { const url = new URL(googleSheetUrl); url.searchParams.set("output", "csv"); exportUrl = url.toString(); }
      else exportUrl = `${googleSheetUrl.replace(/\/$/, "")}/pub?output=csv`;
    } else {
      const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
    }

    if (!exportUrl) { toast.error("Invalid URL", { description: "Please enter a valid Google Sheet URL." }); return; }

    setIsImporting(true);
    try {
      const { data: csvText, error } = await supabase.functions.invoke('proxy-google-sheet', { body: { url: exportUrl } });
      if (error) throw error;
      if (!csvText || typeof csvText !== 'string') throw new Error("Empty or invalid response from proxy");

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data as any[];
          if (parsedData.length > 0) { 
              const headers = Object.keys(parsedData[0]);
              const normalizedData = processImportedData(parsedData, headers);
              setHeaders(headers); 
              setData(normalizedData); 
              setFileName("Google Sheet Import"); 

              // Auto-select phone column if possible
              const likelyPhoneCol = headers.find(h => 
                ['phone', 'mobile', 'wa', 'whatsapp', 'telp', 'hp'].some(k => h.toLowerCase().includes(k))
              );
              if (likelyPhoneCol) setSelectedPhoneColumn(likelyPhoneCol);

              toast.success("Import Successful", { description: `Imported ${parsedData.length} rows from Google Sheet.` });
              setShowDuplicatesOnly(false);
          }
          else { toast.error("Empty Sheet", { description: "No data found in the Google Sheet." }); }
        },
        error: (err) => { throw err; }
      });
    } catch (error: any) { toast.error("Import Failed", { description: "Could not fetch Google Sheet." }); } finally { setIsImporting(false); }
  };

  const handleSaveCampaign = async () => {
    if (!newCampaignName.trim()) {
      toast.error("Name required", { description: "Please enter a name for the campaign." });
      return;
    }
    if (!googleSheetUrl) {
      toast.error("URL required", { description: "No Google Sheet URL to save." });
      return;
    }

    try {
      const { error } = await supabase
        .from('publication_campaigns')
        .insert({
          user_id: user?.id,
          name: newCampaignName,
          sheet_url: googleSheetUrl
        });

      if (error) throw error;

      toast.success("Campaign Saved", { description: `"${newCampaignName}" has been saved to your campaigns.` });
      setSaveCampaignOpen(false);
      setNewCampaignName("");
      queryClient.invalidateQueries({ queryKey: ['publication_campaigns'] });
    } catch (error: any) {
      toast.error("Save Failed", { description: error.message });
    }
  };

  const handleDeleteCampaign = async (id: string, e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation(); // Prevent SelectItem from being selected
    e.preventDefault(); // Prevent default behavior
    
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const { error } = await supabase
        .from('publication_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Campaign Deleted");
      if (selectedCampaign === id) {
        setSelectedCampaign(null);
        setGoogleSheetUrl("");
      }
      queryClient.invalidateQueries({ queryKey: ['publication_campaigns'] });
    } catch (error: any) {
      toast.error("Delete Failed", { description: error.message });
    }
  };

  const handleLoadCampaign = (id: string) => {
    const campaign = savedCampaigns.find(c => c.id === id);
    if (campaign) {
      setGoogleSheetUrl(campaign.sheet_url);
      setSelectedCampaign(id);
      // Optionally auto-import here if desired, but manual import gives user control
    }
  };

  const clearData = () => { 
      setData([]); setHeaders([]); setFileName(null); setSelectedPhoneColumn(""); setGoogleSheetUrl(""); setSearchTerm(""); 
      setShowDuplicatesOnly(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleExportData = () => {
    if (data.length === 0) {
        toast.error("No data to export");
        return;
    }
    
    const exportData = data.map(row => {
        const newRow: any = {};
        headers.filter(h => h !== 'Status' && h !== 'Trigger time').forEach(h => newRow[h] = row[h]);
        if (row['Status']) newRow['Status'] = row['Status'];
        if (row['Trigger time']) newRow['Trigger time'] = row['Trigger time'];
        return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, `Publication_Result_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Data Exported", { description: "Excel file downloaded successfully." });
  };

  const handleUpdateSheet = async () => {
    if (!googleSheetUrl) {
        toast.error("No Google Sheet URL", { description: "This feature only works when data is imported from a Google Sheet." });
        return;
    }

    const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const spreadsheetId = match ? match[1] : null;

    if (!spreadsheetId) {
        toast.error("Invalid URL", { description: "Could not extract Spreadsheet ID." });
        return;
    }

    setIsUpdatingSheet(true);
    try {
        const updateData = data.map(row => {
            const newRow: any = {};
            headers.filter(h => h !== 'Status' && h !== 'Trigger time').forEach(h => newRow[h] = row[h]);
            
            let statusVal = row['Status'];
            if (!statusVal) {
                if (row._status === 'failed') statusVal = 'Failed';
                else if (row._status === 'sent') statusVal = isScheduled ? 'Scheduled' : 'Sent';
                else if (row._status === 'sending') statusVal = 'Sending';
                else statusVal = 'Draft';
            }
            newRow['Status'] = statusVal;

            let timeVal = row['Trigger time'];
            if (!timeVal) {
                if (isScheduled) {
                    if (scheduleMode === 'fixed') {
                        timeVal = fixedScheduleDate ? fixedScheduleDate.replace('T', ' ') : '';
                    } else {
                        const dateVal = row[dynamicDateCol] || '';
                        const timePart = dynamicTimeCol !== 'same_as_date' ? (row[dynamicTimeCol] || '') : '';
                        timeVal = `${dateVal} ${timePart}`.trim();
                    }
                } else {
                    timeVal = 'Immediate';
                }
            }
            newRow['Trigger time'] = timeVal;

            return newRow;
        });

        const { error } = await supabase.functions.invoke('update-google-sheet', {
            body: {
                spreadsheetId,
                data: updateData,
            }
        });

        if (error) throw error;

        toast.success("Sheet Updated", { description: "Data successfully synced to Google Sheet." });
    } catch (error: any) {
        console.error(error);
        toast.error("Update Failed", { description: error.message || "Failed to update Google Sheet." });
    } finally {
        setIsUpdatingSheet(false);
    }
  };

  const insertVariable = (header: string) => {
    const variable = `{{${header}}}`;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart; const end = textarea.selectionEnd; const text = templateMessage;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setTemplateMessage(newText);
      setTimeout(() => { textarea.focus(); const newCursorPos = start + variable.length; textarea.setSelectionRange(newCursorPos, newCursorPos); }, 0);
    } else { setTemplateMessage(prev => prev + variable); }
  };

  const insertUrlVariable = (header: string) => {
    const variable = `{{${header}}}`;
    const input = urlInputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = mediaUrl;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setMediaUrl(newText);
      setTimeout(() => {
        input.focus();
        const newCursorPos = start + variable.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setMediaUrl(prev => prev + variable);
    }
  };

  const insertNotifVariable = () => {
    const variable = "{{name}}";
    const textarea = notifBodyRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = notifBody;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setNotifBody(newText);
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + variable.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setNotifBody(prev => prev + variable);
    }
  };

  const handleAiRewrite = async () => {
    if (!templateMessage) return toast.error("Please enter a draft message first");
    setIsRewriting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-rewrite', {
        body: { 
          text: templateMessage, 
          instructions: aiInstructions + " Use WhatsApp formatting (markdown) like *bold*, _italic_, ~strike~, and emojis. Keep variables like {{name}} intact.",
          context: "WhatsApp Blast Message"
        }
      });
      if (error) throw error;
      setTemplateMessage(data.rewrittenText);
      toast.success("Template rewritten!", { description: "The message has been updated with AI improvements." });
      setShowAiPanel(false);
    } catch (e: any) {
      toast.error("AI Rewrite failed", { description: e.message });
    } finally {
      setIsRewriting(false);
    }
  };

  const handleGenerateMessages = () => {
    if (!templateMessage.trim()) { toast.error("Missing Template", { description: "Please enter a message template." }); return; }
    if (isScheduled) {
        if (scheduleMode === 'fixed' && !fixedScheduleDate) { toast.error("Missing Date", { description: "Please select a date and time for the schedule." }); return; }
        if (scheduleMode === 'dynamic' && !dynamicDateCol) { toast.error("Missing Date Column", { description: "Please select a column for scheduling dates." }); return; }
    }
    setPreviewOpen(true);
  };

  const generatePreviewMessage = (row: any) => {
      let message = templateMessage;
      headers.forEach(header => { const regex = new RegExp(`{{${header}}}`, 'g'); message = message.replace(regex, row[header] || ''); });
      return message;
  };

  const generatePreviewUrl = (row: any) => {
      let url = mediaUrl;
      headers.forEach(header => { const regex = new RegExp(`{{${header}}}`, 'g'); url = url.replace(regex, row[header] || ''); });
      return url;
  };

  const handleCellEdit = (rowIndex: number, column: string, value: string) => {
    setData(prevData => {
      const newData = [...prevData];
      newData[rowIndex] = { ...newData[rowIndex], [column]: value };
      return newData;
    });
  };

  const handleRowContextMenu = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'row',
      targetIndex: rowIndex
    });
  };

  const handleHeaderContextMenu = (e: React.MouseEvent, header: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'header',
      targetHeader: header
    });
  };

  const handleAddRow = () => {
    if (contextMenu?.type === 'row' && contextMenu.targetIndex !== undefined) {
        const newRow: any = {};
        headers.forEach(h => newRow[h] = '');
        
        setData(prevData => {
            const newData = [...prevData];
            newData.splice(contextMenu.targetIndex! + 1, 0, newRow); // Add after the clicked row
            return newData;
        });
        toast.success("Row added");
    }
    setContextMenu(null);
  };

  const handleDeleteRow = () => {
    if (contextMenu?.type === 'row' && contextMenu.targetIndex !== undefined) {
      const newData = [...data];
      newData.splice(contextMenu.targetIndex, 1);
      setData(newData);
      toast.success("Row deleted");
    }
    setContextMenu(null);
  };

  const handleDeleteColumn = () => {
    if (contextMenu?.type === 'header' && contextMenu.targetHeader) {
      const newHeaders = headers.filter(h => h !== contextMenu.targetHeader);
      setHeaders(newHeaders);
      
      // Also update selected phone column if it was deleted
      if (selectedPhoneColumn === contextMenu.targetHeader) {
        setSelectedPhoneColumn("");
      }
      
      toast.success(`Column "${contextMenu.targetHeader}" deleted`);
    }
    setContextMenu(null);
  };

  const getPreviewStatus = (row: any) => {
    if (row._status === 'failed') {
        return (
            <div className="flex flex-col text-red-600">
                <span className="font-medium text-[10px] flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-50" />
                    Failed
                </span>
                <span className="text-[9px] truncate max-w-[100px] cursor-help" title={row._error}>{row._error || 'Unknown error'}</span>
            </div>
        );
    }
    if (row._status === 'sent') {
        if (isScheduled) {
            let displayTime = "";
            if (scheduleMode === 'fixed') {
                displayTime = fixedScheduleDate ? new Date(fixedScheduleDate).toLocaleString() : "Pending";
            } else {
                const dateVal = row[dynamicDateCol] || '';
                const timePart = dynamicTimeCol !== 'same_as_date' ? (row[dynamicTimeCol] || '') : '';
                displayTime = `${dateVal} ${timePart}`.trim();
            }

            return (
                <div className="flex flex-col text-blue-600">
                    <span className="font-medium text-[10px] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Scheduled
                    </span>
                    <span className="text-[9px] text-muted-foreground/70">{displayTime}</span>
                </div>
            );
        }

        return (
            <div className="flex flex-col text-green-600">
                <span className="font-medium text-[10px] flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Sent
                </span>
                <span className="text-[9px] text-muted-foreground/70">{new Date().toLocaleTimeString()}</span>
            </div>
        );
    }
    if (row._status === 'sending') {
        return <span className="text-blue-600 text-[10px] animate-pulse">Sending...</span>;
    }

    if (isScheduled) {
      if (scheduleMode === 'fixed') {
        if (!fixedScheduleDate) return <span className="text-muted-foreground italic">Pending Schedule</span>;
        const date = new Date(fixedScheduleDate);
        return (
          <div className="flex flex-col">
            <span className="text-blue-600 font-medium text-[10px] flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled</span>
            <span className="text-[10px] text-muted-foreground">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            <span className="text-[9px] text-muted-foreground/70">{date.toLocaleDateString()}</span>
          </div>
        );
      } else {
        const dateVal = row[dynamicDateCol];
        const timeVal = dynamicTimeCol !== 'same_as_date' ? row[dynamicTimeCol] : '';
        if (!dateVal) return <span className="text-destructive text-[10px]">Missing Date</span>;
        return (
          <div className="flex flex-col">
            <span className="text-blue-600 font-medium text-[10px] flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled</span>
            <span className="text-[10px] text-muted-foreground truncate">{dateVal} {timeVal}</span>
          </div>
        );
      }
    }

    return (
      <div className="flex flex-col">
        <span className="text-slate-500 font-medium text-[10px] flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Draft
        </span>
        <span className="text-[9px] text-muted-foreground/70">Ready</span>
      </div>
    );
  };

  const getRowTriggerTimeDisplay = (row: any) => {
      if (isScheduled) {
          if (scheduleMode === 'fixed') return <span className="text-[10px] text-muted-foreground">{fixedScheduleDate ? new Date(fixedScheduleDate).toLocaleString() : '-'}</span>;
          
          const dateVal = row[dynamicDateCol] || '';
          let timeVal = dynamicTimeCol !== 'same_as_date' ? (row[dynamicTimeCol] || '') : '';
          
          // Attempt to format time to HH:mm for consistent display
          if (timeVal) {
             // Check if time is like '4:05' or '16:5' and pad it to '04:05' or '16:05'
             const timeParts = String(timeVal).match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
             if (timeParts) {
                 timeVal = `${timeParts[1].padStart(2, '0')}:${timeParts[2].padStart(2, '0')}`;
             }
          }

          const displayTime = `${dateVal} ${timeVal}`.trim();
          return <span className="text-[10px] text-muted-foreground">{displayTime || '-'}</span>;
      }
      
      if (row['Trigger time']) return <span className="text-[10px] font-mono">{row['Trigger time']}</span>;
      
      return <span className="text-[10px] text-muted-foreground">Immediate</span>;
  };

  const duplicatesCount = useMemo(() => {
    if (!selectedPhoneColumn) return 0;
    const phones = data.map(row => normalizePhone(row[selectedPhoneColumn]));
    const uniquePhones = new Set(phones);
    return phones.length - uniquePhones.size;
  }, [data, selectedPhoneColumn]);

  const duplicatePhones = useMemo(() => {
    if (!selectedPhoneColumn) return new Set<string>();
    const phones = data.map(row => normalizePhone(row[selectedPhoneColumn]));
    const counts = new Map<string, number>();

    phones.forEach(phone => {
        if (phone) {
            counts.set(phone, (counts.get(phone) || 0) + 1);
        }
    });

    const duplicates = new Set<string>();
    counts.forEach((count, phone) => {
        if (count > 1) {
            duplicates.add(phone);
        }
    });
    return duplicates;
  }, [data, selectedPhoneColumn]);

  // Calculate preview indices based on selection
  const previewIndices = useMemo(() => {
    return getIndicesFromRange(rowRange, data.length);
  }, [rowRange, data.length]);

  // Get the row to use for preview (first one in the selected range)
  const previewRow = data.length > 0 && previewIndices.length > 0 ? data[previewIndices[0]] : null;

  const targetPhoneList = useMemo(() => {
    if (!previewIndices.length || !selectedPhoneColumn || !data.length) return "No phones";
    
    if (previewIndices.length <= 5) {
        return previewIndices.map(i => data[i][selectedPhoneColumn]).filter(Boolean).join(', ');
    }
    
    const firstFive = previewIndices.slice(0, 5).map(i => data[i][selectedPhoneColumn]).filter(Boolean);
    return `${firstFive.join(', ')} and ${previewIndices.length - 5} others`;
  }, [previewIndices, selectedPhoneColumn, data]);

  const processSending = async (indices: number[]) => {
    setIsSending(true);
    setPreviewOpen(false); // Close preview dialog immediately to show progress
    
    // Determine mode based on switch
    if (vipMode) {
        toast.info("Starting VIP Anti-Spam Blast", { 
            description: "Messages will be sent sequentially (< 50/hour) with AI-generated unique variations to ensure safety." 
        });

        let sentCount = 0;
        let failedCount = 0;
        let processedInBatch = 0;

        for (const i of indices) {
            const row = data[i];
            let phone = normalizePhone(row[selectedPhoneColumn]);
            
            if (!phone || phone.length <= 5) continue;

            // Update UI to show "Sending..."
            setData(prevData => prevData.map((r, idx) => 
                idx === i ? { ...r, _status: 'sending' } : r
            ));

            try {
                const baseMessage = generatePreviewMessage(row);
                const finalUrl = generatePreviewUrl(row);
                let finalMessage = baseMessage;

                // AI Variation Generation with Anti-Spam Rules
                try {
                    // Clean the message of variable placeholders for the AI context if needed, 
                    // but here we use the fully populated baseMessage so the AI sees the real content.
                    // We instruct AI to KEEP the core data.
                    const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-rewrite', {
                        body: { 
                            text: baseMessage, 
                            instructions: "Rewrite this message to make it unique to avoid spam filters. \n" +
                                          "CRITICAL RULES:\n" +
                                          "1. DO NOT change any dates, times, numbers, amounts, or URL links. These are the Core Agenda.\n" +
                                          "2. Maintain the Company Identity/Sender context found in the message.\n" +
                                          "3. Change the sentence structure, greeting, and closing phrase slightly.\n" +
                                          "4. Tone: Professional, elegant, and polite (VIP hospitality).\n" +
                                          "5. Output only the message text, nothing else.",
                            context: "VIP Guest Notification (Anti-Spam Mode)"
                        }
                    });
                    if (!aiError && aiData?.rewrittenText) {
                        finalMessage = aiData.rewrittenText;
                    }
                } catch (err) {
                    console.warn("AI Variation failed, using base message", err);
                }

                // Construct Message Payload
                const messageData: any = { 
                    phone, 
                    type: messageType,
                    message: finalMessage 
                };

                if (messageType !== 'text') {
                    if (finalUrl && finalUrl.trim()) {
                        messageData.url = finalUrl;
                        messageData.caption = finalMessage; 
                        messageData.message = finalMessage; // Fallback
                    } else {
                        messageData.type = 'text'; // Fallback to text if no URL
                    }
                }

                // Handle Scheduling (same logic as batch)
                if (isScheduled) {
                    if (scheduleMode === 'fixed') {
                        messageData.schedule_time = fixedScheduleDate.replace('T', ' ');
                        messageData.timezone = fixedTimezone;
                    } else {
                        let rawDate = row[dynamicDateCol] || '';
                        let rawTime = dynamicTimeCol !== 'same_as_date' ? (row[dynamicTimeCol] || '') : '';
                        const combinedDateTimeStr = `${rawDate} ${rawTime}`.trim();
                        messageData.schedule_time = combinedDateTimeStr;
                    }
                }

                // Send single message via existing function (using it as a single-item batch)
                const { data: result, error } = await supabase.functions.invoke('send-whatsapp-blast', { 
                    body: { messages: [messageData] } 
                });

                if (error) throw error;

                // Check result
                if (result && result.failed > 0) {
                    const firstError = result.errors?.[0];
                    const errorMsg = typeof firstError === 'object' ? (firstError.error || firstError.message) : firstError;
                    throw new Error(errorMsg || "Unknown error");
                }

                // Success Update
                sentCount++;
                processedInBatch++;
                const newTriggerTime = isScheduled ? (messageData.schedule_time || "Scheduled") : new Date().toLocaleString();
                
                setData(prevData => prevData.map((r, idx) => 
                    idx === i ? { 
                        ...r, 
                        _status: 'sent', 
                        _error: undefined,
                        'Status': isScheduled ? 'Scheduled' : 'Sent',
                        'Trigger time': newTriggerTime,
                        'Message Body': finalMessage // Optional: save the varied message
                    } : r
                ));

                // --- BATCH DELAY LOGIC ---
                if (processedInBatch >= 20) {
                    toast.info("Cooling Down", { description: "Pausing for 30s after sending 20 messages..." });
                    await wait(30000); // 30 seconds pause
                    processedInBatch = 0; // Reset counter
                } else {
                    // Standard Random Rate Limiting Delay (10-20 seconds)
                    const delayMs = Math.floor(Math.random() * (20000 - 10000 + 1) + 10000);
                    await wait(delayMs);
                }

            } catch (err: any) {
                console.error("VIP Send Error:", err);
                failedCount++;
                processedInBatch++; // Still count attempt towards batch
                
                setData(prevData => prevData.map((r, idx) => 
                    idx === i ? { 
                        ...r, 
                        _status: 'failed', 
                        _error: err.message,
                        'Status': 'Error',
                        'Trigger time': 'N/A' 
                    } : r
                ));
                
                // Apply batch delay even on error if threshold reached
                if (processedInBatch >= 20) {
                    toast.info("Cooling Down", { description: "Pausing for 30s after 20 attempts..." });
                    await wait(30000);
                    processedInBatch = 0;
                } else {
                    await wait(5000); // Short delay on error
                }
            }
        }

        toast.success("VIP Blast Completed", { 
            description: `Processed ${indices.length} contacts. Sent: ${sentCount}, Failed: ${failedCount}` 
        });
        setIsSending(false);
        return;
    }

    // Regular Bulk Mode (Fast)
    toast.info("Sending...", { description: `Processing ${indices.length} messages request.` });

    // Update status for these rows
    setData(prevData => prevData.map((row, i) => 
      indices.includes(i) ? { ...row, _status: 'sending', _error: undefined } : row
    ));

    try {
        const messages = indices.map(i => {
            const row = data[i];
            let phone = normalizePhone(row[selectedPhoneColumn]);
            
            const finalUrl = generatePreviewUrl(row);
            const msgContent = generatePreviewMessage(row);
            
            const messageData: any = { 
                phone, 
                type: messageType,
                // Pass original index to identify it later if needed, though currently we rely on phone
                _originalIndex: i 
            };
            
            if (messageType === 'text') {
                messageData.message = msgContent;
            } else {
                if (finalUrl && finalUrl.trim()) {
                    messageData.url = finalUrl;
                    messageData.caption = msgContent; 
                    messageData.message = msgContent; 
                } else {
                    messageData.type = 'text';
                    messageData.message = msgContent;
                }
            }

            if (isScheduled) {
                if (scheduleMode === 'fixed') {
                    messageData.schedule_time = fixedScheduleDate.replace('T', ' ');
                    messageData.timezone = fixedTimezone;
                } else {
                    let rawDate = row[dynamicDateCol] || '';
                    let rawTime = dynamicTimeCol !== 'same_as_date' ? (row[dynamicTimeCol] || '') : '';
                    const combinedDateTimeStr = `${rawDate} ${rawTime}`.trim();
                    messageData.schedule_time = combinedDateTimeStr;
                }
            }
            return messageData;
        }).filter(m => m.phone.length > 5);

        // Deduplicate
        const uniqueMessages: any[] = [];
        const seen = new Set();
        for (const msg of messages) {
            const key = `${msg.phone}-${msg.message}-${msg.url || ''}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueMessages.push(msg);
            }
        }

        if (uniqueMessages.length < messages.length) {
            console.log(`Filtered out ${messages.length - uniqueMessages.length} duplicates in the batch.`);
        }

        const { data: result, error } = await supabase.functions.invoke('send-whatsapp-blast', { body: { messages: uniqueMessages } });
        
        if (error) throw error;
        
        setData(prevData => prevData.map((row, i) => {
            // Only update rows that were part of this batch
            if (!indices.includes(i)) return row;

            const rowPhone = normalizePhone(row[selectedPhoneColumn]);
            let newTriggerTime = "";

            if (isScheduled) {
                if (scheduleMode === 'fixed') {
                    newTriggerTime = fixedScheduleDate.replace('T', ' ');
                } else {
                    const sentMsg = uniqueMessages.find((m: any) => m.phone === rowPhone);
                    newTriggerTime = sentMsg?.schedule_time || `${row[dynamicDateCol]} ${row[dynamicTimeCol] || ''}`;
                }
            } else {
                newTriggerTime = new Date().toLocaleString();
            }
            
            const failure = result.errors?.find((e: any) => {
                const errorPhone = typeof e === 'object' ? e.phone : null;
                return errorPhone === rowPhone;
            });
            
            if (failure) {
                const errorMsg = typeof failure === 'object' ? (failure.error || failure.message) : failure;
                return { 
                    ...row, 
                    _status: 'failed', 
                    _error: errorMsg,
                    'Status': 'Failed',
                    'Trigger time': newTriggerTime
                };
            }
            
            if (rowPhone.length > 5) {
                return { 
                    ...row, 
                    _status: 'sent', 
                    _error: undefined,
                    'Status': isScheduled ? 'Scheduled' : 'Sent',
                    'Trigger time': newTriggerTime
                };
            }
            
            return { ...row, _status: undefined }; 
        }));

        let errorMessage = "";
        if (result.failed > 0 && result.errors && result.errors.length > 0) {
            const firstError = result.errors[0];
            const errorText = typeof firstError === 'object' ? (firstError.error || firstError.message || JSON.stringify(firstError)) : firstError;
            errorMessage = ` First error: ${errorText}`;
        }

        if (result.failed > 0) {
             toast.warning("Blast Completed with Failures", { 
                description: `Sent: ${result.success}, Failed: ${result.failed}.${errorMessage}` 
            });
        } else {
            toast.success("Blast Completed", { 
                description: `Successfully sent ${result.success} messages.` 
            });
        }
        
    } catch (error: any) { 
        // Mark filtered rows as failed
        setData(prevData => prevData.map((row, i) => 
            indices.includes(i) ? { ...row, _status: 'failed', _error: error.message, 'Status': 'Error', 'Trigger time': 'N/A' } : row
        ));
        toast.error("Blast Failed", { description: error.message || "Unknown error occurred" }); 
    } finally { 
        setIsSending(false); 
    }
  };

  const handleSendMessages = async () => {
    // 1. Determine indices to send
    const indices = getIndicesFromRange(rowRange, data.length);
    
    if (indices.length === 0) {
        toast.error("No Rows Selected", { description: "The selected range matches no rows." });
        return;
    }

    // 2. Check for previously sent in this session
    const previouslySentIndices = indices.filter(i => {
        const row = data[i];
        // Check if it looks "sent" or "scheduled"
        return row._status === 'sent' || row['Status'] === 'Sent' || row['Status'] === 'Scheduled';
    });

    if (previouslySentIndices.length > 0) {
        setDuplicateRows(previouslySentIndices);
        setPendingRangeIndices(indices);
        setConfirmResendOpen(true);
        return;
    }

    // 3. If no duplicates, send immediately
    await processSending(indices);
  };

  const handleConfirmResend = async () => {
    setConfirmResendOpen(false);
    await processSending(pendingRangeIndices);
  };

  const handleSendTestInAppNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      toast.error("Missing Information", { description: "Title and Body are required for test." });
      return;
    }

    if (!user) {
       toast.error("Not authenticated");
       return;
    }

    // Determine the name to use for replacement in the toast preview
    const currentProfile = profiles.find((p: any) => p.value === user.id);
    const currentName = currentProfile ? currentProfile.label : (user.name || user.email || 'User');
    const previewBody = notifBody.replace(/{{name}}/gi, currentName);

    setIsSendingTestNotif(true);
    try {
      const { error } = await supabase.functions.invoke('send-app-broadcast', {
        body: {
          title: `[TEST] ${notifTitle}`,
          body: notifBody,
          target: 'specific',
          targetValue: [user.id],
          link: notifLink,
        }
      });

      if (error) throw error;
      
      toast.success("Test Broadcast Sent", { 
        description: (
          <div className="mt-2 w-full p-3 bg-card text-card-foreground border rounded-md shadow-sm">
            <p className="font-semibold text-sm"><span className="text-primary mr-1">[TEST]</span>{notifTitle}</p>
            <div className="text-xs text-muted-foreground line-clamp-3 mt-1">
               <InteractiveText text={previewBody} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Check your notifications.
            </p>
          </div>
        ),
        duration: 5000,
      });
    } catch (error: any) {
      toast.error("Test Failed", { description: error.message });
    } finally {
      setIsSendingTestNotif(false);
    }
  };

  // In-App Notification Handler
  const handleSendInAppNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      toast.error("Missing Information", { description: "Title and Body are required." });
      return;
    }
    
    let targetValue: any = null;
    if (notifTarget === 'role') {
      if (!notifRole) { toast.error("Missing Role", { description: "Please select a role." }); return; }
      targetValue = notifRole;
    } else if (notifTarget === 'specific') {
      if (notifUsers.length === 0) { toast.error("Missing Users", { description: "Please select at least one user." }); return; }
      targetValue = notifUsers;
    }

    setIsSendingNotif(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-app-broadcast', {
        body: {
          title: notifTitle,
          body: notifBody,
          target: notifTarget,
          targetValue,
          link: notifLink,
        }
      });

      if (error) throw error;
      
      toast.success("Broadcast Sent", { 
        description: (
          <div className="mt-2 w-full p-3 bg-card text-card-foreground border rounded-md shadow-sm">
            <p className="font-semibold text-sm">{notifTitle}</p>
            <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{notifBody}</p>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Successfully sent to {data.count} user(s).
            </p>
          </div>
        ),
        duration: 5000,
      });
      
      // Reset form
      setNotifTitle("");
      setNotifBody("");
      setNotifLink("");
      setNotifUsers([]);
    } catch (error: any) {
      toast.error("Broadcast Failed", { description: error.message });
    } finally {
      setIsSendingNotif(false);
    }
  };

  const getRowHeightClass = () => {
    switch(rowDensity) {
      case "compact": return "min-h-8 py-1 text-xs";
      case "normal": return "min-h-10 py-2 text-sm";
      case "spacious": return "min-h-12 py-3 text-sm";
      default: return "min-h-12 py-3 text-sm";
    }
  };

  const filteredData = useMemo(() => {
    const processed = data.map((row, index) => ({ ...row, _originalIndex: index }));
    
    let result = processed;

    if (showDuplicatesOnly && selectedPhoneColumn) {
       result = result.filter(row => {
           const phone = normalizePhone(row[selectedPhoneColumn]);
           return duplicatePhones.has(phone);
       });
    }

    if (!searchTerm) return result;
    const lowerTerm = searchTerm.toLowerCase();
    return result.filter(row => 
      headers.some(h => 
        h !== 'Status' && h !== 'Trigger time' && String(row[h] || "").toLowerCase().includes(lowerTerm)
      )
    );
  }, [data, searchTerm, headers, showDuplicatesOnly, selectedPhoneColumn, duplicatePhones]);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Publication</h1>
          <p className="text-muted-foreground">
            Manage app notifications and send WhatsApp blasts.
          </p>
        </div>

        <Tabs defaultValue="whatsapp" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="whatsapp">
              <MessageSquare className="mr-2 h-4 w-4" />
              WhatsApp Blast
            </TabsTrigger>
            <TabsTrigger value="in-app">
              <Bell className="mr-2 h-4 w-4" />
              In-App Notification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="mt-6">
             <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column: Form */}
                <Card className="h-fit">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-semibold">Create Template Messages</CardTitle>
                      <div className="flex gap-2">
                         <Button variant="outline" size="sm" className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/10 h-8 text-xs">
                            <PlayCircle className="mr-1 h-3.5 w-3.5" />
                            Watch Tutorial
                         </Button>
                         <Button variant="outline" size="sm" className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/10 h-8 text-xs">
                            <Info className="mr-1 h-3.5 w-3.5" />
                            More Info
                         </Button>
                      </div>
                   </CardHeader>
                   <CardContent className="space-y-6 pt-6">
                      {/* Message Template */}
                      <div className="space-y-2">
                         <div className="flex justify-between items-center">
                            <Label htmlFor="template" className="text-sm font-medium">
                               Message Template <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 mr-2">
                                    <Switch id="vip-mode" checked={vipMode} onCheckedChange={setVipMode} />
                                    <Label htmlFor="vip-mode" className="text-xs font-medium cursor-pointer flex items-center gap-1 text-amber-600">
                                        <Crown className="w-3 h-3" /> VIP Mode
                                    </Label>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => setShowAiPanel(!showAiPanel)}
                                >
                                    <Wand2 className="w-3 h-3 mr-1" />
                                    {showAiPanel ? "Close AI" : "AI Rewrite"}
                                </Button>
                            </div>
                         </div>

                         {vipMode && (
                            <div className="bg-amber-50 border border-amber-100 rounded-md p-2 text-[10px] text-amber-800 animate-in fade-in slide-in-from-top-1 space-y-1">
                                <div className="flex items-center gap-1 font-semibold">
                                    <ShieldCheck className="w-3 h-3" /> 
                                    <span>Anti-Spam Conceptual Active</span>
                                </div>
                                <ul className="list-disc list-inside pl-1 opacity-90">
                                    <li><strong>Smart Variation:</strong> AI rewrites each message uniquely to prevent block detection.</li>
                                    <li><strong>Core Agenda Lock:</strong> Dates, Times, Links, and Company Identity are strictly preserved.</li>
                                    <li><strong>Safe Timing:</strong> 10-20s random delay, plus 30s pause every 20 messages.</li>
                                </ul>
                            </div>
                         )}

                         {showAiPanel && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-md p-3 mb-2 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                               <div className="space-y-1">
                                  <Label className="text-xs font-medium text-blue-800 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-blue-500" />
                                    AI Instructions (Optional)
                                  </Label>
                                  <Input 
                                     className="h-8 text-xs bg-white placeholder:text-muted-foreground/60" 
                                     placeholder="e.g. Make it professional, use more emojis, format with bold..." 
                                     value={aiInstructions}
                                     onChange={e => setAiInstructions(e.target.value)}
                                  />
                                  <p className="text-[10px] text-blue-600/80">The AI will rewrite your template using WhatsApp markdown and emojis while keeping variables intact.</p>
                                </div>
                               <div className="flex justify-end">
                                  <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={handleAiRewrite} disabled={isRewriting || !templateMessage}>
                                     {isRewriting ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Bot className="w-3 h-3 mr-1"/>}
                                     Rewrite Template
                                  </Button>
                                </div>
                            </div>
                         )}

                         <Textarea 
                            id="template" 
                            ref={textareaRef}
                            placeholder="Hi {{name}}, your payment of {{amount}} is due." 
                            className="min-h-[120px] font-mono text-sm"
                            value={templateMessage}
                            onChange={(e) => setTemplateMessage(e.target.value)}
                         />
                         <div className="text-xs text-muted-foreground">
                            <p className="mb-1.5">Click to insert variable:</p>
                            {headers.length > 0 ? (
                               <div className="flex flex-wrap gap-1.5">
                                 {headers.filter(h => h !== 'Status' && h !== 'Trigger time').map(h => (
                                   <Badge 
                                     key={h} 
                                     variant="secondary" 
                                     className="cursor-pointer hover:bg-blue-100 text-blue-600 bg-blue-50 border-blue-100 px-2 py-1 font-mono text-xs"
                                     onMouseDown={(e) => {
                                       e.preventDefault();
                                       insertVariable(h);
                                     }}
                                   >
                                     {`{{${h}}}`}
                                   </Badge>
                                 ))}
                               </div>
                            ) : (
                               <span className="text-muted-foreground/60 italic">Available variables will appear after upload.</span>
                            )}
                         </div>
                      </div>

                      {messageType !== 'text' && (
                          <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2">
                              {headers.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-sm text-blue-600 font-medium">
                                    Available Variables (Click to Insert into {messageType === 'image' ? 'Image' : 'File'} URL)
                                  </Label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {headers.filter(h => h !== 'Status' && h !== 'Trigger time').map(h => (
                                      <Badge 
                                        key={h} 
                                        variant="secondary" 
                                        className="cursor-pointer hover:bg-blue-100 text-blue-600 bg-blue-50 border-blue-100 px-2 py-1 font-mono text-xs"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          insertUrlVariable(h);
                                        }}
                                      >
                                        {`{{${h}}}`}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                      {messageType === 'image' ? 'Image URL' : 'File URL'}
                                  </Label>
                                  <Input 
                                    type="text"
                                    ref={urlInputRef}
                                    value={mediaUrl} 
                                    onChange={e => setMediaUrl(e.target.value)} 
                                    placeholder={messageType === 'image' ? "https://example.com/image.jpg" : "https://example.com/document.pdf"} 
                                    className="text-sm"
                                  />
                                  <div className="flex gap-2 text-[10px] text-muted-foreground items-center">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-5">Static</Badge> 
                                    <span>{messageType === 'image' ? "https://example.com/image.jpg" : "https://example.com/document.pdf"}</span>
                                  </div>
                                  <div className="flex gap-2 text-[10px] text-muted-foreground items-center">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 h-5">Dynamic</Badge> 
                                    <span>{messageType === 'image' ? "https://example.com/{{image_column}}.jpg" : "https://example.com/{{file_column}}.pdf"} (click variable pills to insert)</span>
                                  </div>
                              </div>
                          </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                         <div className="space-y-2">
                            <Label>Message Type</Label>
                            <Select value={messageType} onValueChange={setMessageType}>
                               <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select type" />
                               </SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="text">Text Message</SelectItem>
                                  <SelectItem value="image">Image + Text Message</SelectItem>
                                  <SelectItem value="document">File + Text Message</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                         
                         <div className="space-y-2">
                            <Label>Phone Number Column <span className="text-red-500">*</span></Label>
                            <Select value={selectedPhoneColumn} onValueChange={setSelectedPhoneColumn} disabled={headers.length === 0}>
                               <SelectTrigger className={headers.length === 0 ? "bg-muted/50 text-muted-foreground" : ""}>
                                  <SelectValue placeholder={headers.length === 0 ? "Upload file first" : "Select column"} />
                               </SelectTrigger>
                               <SelectContent>
                                  {headers.filter(h => h !== 'Status' && h !== 'Trigger time').map((header) => (
                                     <SelectItem key={header} value={header}>{header}</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                         </div>
                      </div>

                      {/* Import Section */}
                      <div className="space-y-3">
                         <div className="flex justify-between items-center">
                            <Label>Import Data <span className="text-red-500">*</span></Label>
                            
                            {/* Saved Campaigns Dropdown */}
                            <div className="w-[200px]">
                              <Select 
                                value={selectedCampaign || ""} 
                                onValueChange={handleLoadCampaign}
                                disabled={isLoadingCampaigns || savedCampaigns.length === 0}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <FolderOpen className="h-3.5 w-3.5 mr-2" />
                                  <SelectValue placeholder="Load Saved Campaign" />
                                </SelectTrigger>
                                <SelectContent>
                                  {savedCampaigns.map((campaign) => (
                                    <SelectItem 
                                        key={campaign.id} 
                                        value={campaign.id}
                                        className="cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between w-full min-w-[180px]">
                                            <div className="flex flex-col text-left mr-2">
                                                <span className="text-sm font-medium">{campaign.name}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                  Updated: {formatDistanceToNow(new Date(campaign.updated_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <div
                                                role="button"
                                                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleDeleteCampaign(campaign.id, e)}
                                                onPointerDown={(e) => e.stopPropagation()} // Prevent SelectItem selection logic
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                    </SelectItem>
                                  ))}
                                  {savedCampaigns.length === 0 && (
                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                      No saved campaigns
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                         </div>
                         
                         {!fileName ? (
                           <div className="space-y-3">
                             {/* Drag & Drop Zone */}
                             <div 
                                className={`border-2 border-dashed rounded-lg p-2 flex items-center justify-center cursor-pointer transition-colors h-10 ${
                                   isDragging ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/50"
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                             >
                                <input 
                                   type="file" 
                                   ref={fileInputRef} 
                                   className="hidden" 
                                   accept=".csv, .xls, .xlsx" 
                                   onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <UploadCloud className="h-4 w-4" />
                                    <span>Click or drag CSV, XLS, XLSX</span>
                                </div>
                             </div>

                             <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                   <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                   <span className="bg-background px-2 text-muted-foreground">Or import from URL</span>
                                </div>
                             </div>

                             {/* Google Sheet URL Input */}
                             <div className="flex gap-2">
                                <Input 
                                   placeholder="Paste Google Sheet URL (Public / Published to Web)" 
                                   value={googleSheetUrl}
                                   onChange={(e) => setGoogleSheetUrl(e.target.value)}
                                   className="text-sm"
                                   disabled={isImporting}
                                />
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  onClick={() => setSaveCampaignOpen(true)}
                                  disabled={!googleSheetUrl}
                                  title="Save as Campaign"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button variant="secondary" onClick={handleGoogleSheetImport} disabled={!googleSheetUrl || isImporting}>
                                   {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                   Import
                                </Button>
                             </div>
                           </div>
                         ) : (
                           <div className="flex items-center justify-between p-2 bg-primary/5 border border-primary/10 rounded-md h-12">
                              <div className="flex items-center gap-2 px-2">
                                 <FileSpreadsheet className="h-4 w-4 text-primary" />
                                 <div className="flex flex-col">
                                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{fileName}</p>
                                    <p className="text-[10px] text-muted-foreground leading-none">{data.length} rows</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-1">
                                  {fileName === "Google Sheet Import" && (
                                      <Button variant="ghost" size="icon" onClick={handleGoogleSheetImport} disabled={isImporting} className="h-8 w-8 text-muted-foreground hover:text-primary">
                                          {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                      </Button>
                                  )}
                                  <Button variant="ghost" size="icon" onClick={clearData} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                     <X className="h-4 w-4" />
                                  </Button>
                              </div>
                           </div>
                         )}
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label className="text-xs">Rows to Send (Optional)</Label>
                            <div className="flex gap-2 items-center">
                                <ListFilter className="h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="e.g. 5, 10-20, 25" 
                                    value={rowRange} 
                                    onChange={(e) => setRowRange(e.target.value)} 
                                    className="text-sm"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Leave empty to send to all rows. Enter specific row numbers (e.g. 5, 10) or ranges (e.g. 1-50), separated by commas.</p>
                        </div>

                        <div className="flex items-center space-x-2 border-t border-dashed pt-3">
                            <Switch id="schedule" checked={isScheduled} onCheckedChange={setIsScheduled} />
                            <Label htmlFor="schedule" className="font-medium cursor-pointer">Schedule Messages (Optional)</Label>
                        </div>

                        {isScheduled && (
                            <div className="pl-2 space-y-4 border-l-2 border-primary/20 ml-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                <div className="space-y-2">
                                    <Label>Scheduling Mode</Label>
                                    <div className="flex flex-wrap gap-6">
                                        <div className="flex items-center space-x-2">
                                            <input 
                                                type="radio" 
                                                id="mode-fixed" 
                                                name="scheduleMode" 
                                                value="fixed"
                                                checked={scheduleMode === "fixed"}
                                                onChange={() => setScheduleMode("fixed")}
                                                className="text-primary focus:ring-primary h-4 w-4"
                                            />
                                            <Label htmlFor="mode-fixed" className="font-normal cursor-pointer text-sm">Fixed Schedule (Same time for all)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input 
                                                type="radio" 
                                                id="mode-dynamic" 
                                                name="scheduleMode" 
                                                value="dynamic"
                                                checked={scheduleMode === "dynamic"}
                                                onChange={() => setScheduleMode("dynamic")}
                                                className="text-primary focus:ring-primary h-4 w-4"
                                            />
                                            <Label htmlFor="mode-dynamic" className="font-normal cursor-pointer text-sm">Dynamic from CSV (Per-row scheduling)</Label>
                                        </div>
                                    </div>
                                </div>

                                {scheduleMode === "fixed" ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Schedule Date & Time</Label>
                                            <Input 
                                                type="datetime-local" 
                                                value={fixedScheduleDate} 
                                                onChange={(e) => setFixedScheduleDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Timezone</Label>
                                            <Select value={fixedTimezone} onValueChange={setFixedTimezone}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select timezone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UTC">UTC</SelectItem>
                                                    <SelectItem value="Asia/Jakarta">Asia/Jakarta</SelectItem>
                                                    <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                                                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                                                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 text-blue-800 p-3 rounded-md border border-blue-100 flex gap-2 items-start text-sm">
                                            <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                                            <div>
                                                <p className="font-semibold">Dynamic Scheduling from CSV</p>
                                                <p className="text-xs opacity-90 mt-1">Select CSV columns that contain scheduling information. Each message will be scheduled based on its row data.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Date Column <span className="text-red-500">*</span></Label>
                                                <Select value={dynamicDateCol} onValueChange={setDynamicDateCol} disabled={headers.length === 0}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select date column" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {headers.filter(h => h !== 'Status' && h !== 'Trigger time').map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground">Column with date (YYYY-MM-DD or MM/DD/YYYY)</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Time Column</Label>
                                                <Select value={dynamicTimeCol} onValueChange={setDynamicTimeCol} disabled={headers.length === 0}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Optional - same as date" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="same_as_date">Optional - same as date column</SelectItem>
                                                        {headers.filter(h => h !== 'Status' && h !== 'Trigger time').map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground">Column with time (HH:MM or HH:MM:SS)</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4">
                         <Button 
                            className="min-w-[140px]" 
                            disabled={!selectedPhoneColumn || data.length === 0 || !templateMessage.trim()}
                            onClick={handleGenerateMessages}
                         >
                            Send Messages
                         </Button>
                         <span className="text-xs text-muted-foreground">
                            {data.length > 0 ? `${data.length} messages ready` : "Upload data to begin"}
                         </span>
                      </div>
                   </CardContent>
                </Card>

                {/* Right Column: Preview */}
                <Card className="h-[400px] flex flex-col shadow-sm overflow-hidden">
                   <CardHeader className="border-b pb-4 flex flex-row items-center justify-between space-y-0">
                      <div>
                          <CardTitle className="text-xl font-semibold">Data Preview</CardTitle>
                          <CardDescription>
                             {data.length > 0 
                                ? `Showing all ${data.length} rows` 
                                : "Upload a file to see the data preview"}
                             {duplicatesCount > 0 && (
                                <span 
                                  className={cn(
                                    "ml-2 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors select-none",
                                    showDuplicatesOnly 
                                      ? "bg-amber-500 text-white shadow-sm" 
                                      : "text-amber-600 bg-amber-100 hover:bg-amber-200"
                                  )}
                                  onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                                  title={showDuplicatesOnly ? "Show all rows" : "Show only duplicates"}
                                >
                                   {duplicatesCount} duplicate(s) found
                                   {showDuplicatesOnly && " (Showing)"}
                                </span>
                             )}
                          </CardDescription>
                      </div>
                      <div className="flex gap-2 items-center">
                          {data.length > 0 && (
                            <div className="relative mr-2">
                                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                  placeholder="Search data..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pl-8 h-8 text-xs w-[150px] lg:w-[180px]"
                                />
                            </div>
                          )}
                          {data.length > 0 && (
                              <>
                                <Select value={rowDensity} onValueChange={(v: any) => setRowDensity(v)}>
                                  <SelectTrigger className="w-[100px] h-8 text-xs">
                                    <Scaling className="w-3.5 h-3.5 mr-2" />
                                    <SelectValue placeholder="Density" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="compact">Compact</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="spacious">Spacious</SelectItem>
                                  </SelectContent>
                                </Select>
                                {googleSheetUrl && (
                                    <Button variant="outline" size="sm" onClick={handleUpdateSheet} disabled={isUpdatingSheet} className="h-8 px-2">
                                        {isUpdatingSheet ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <UploadCloud className="h-3.5 w-3.5 mr-1" />}
                                        Update Sheet
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={handleExportData} className="h-8 px-2">
                                    <Download className="h-3.5 w-3.5 mr-1" />
                                    Export Data
                                </Button>
                              </>
                          )}
                      </div>
                   </CardHeader>
                   <CardContent className="p-0 flex-1 overflow-hidden relative">
                      {data.length > 0 ? (
                         <ScrollArea className="h-full w-full rounded-md">
                            <div className="w-max min-w-full p-4">
                               <Table>
                                  <TableHeader>
                                     <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[50px] font-bold text-foreground">#</TableHead>
                                        {headers.filter(h => h !== 'Status' && h !== 'Trigger time').map((header) => (
                                           <TableHead 
                                              key={header} 
                                              className="font-bold text-foreground relative group select-none whitespace-normal break-words align-top py-2 cursor-context-menu"
                                              style={{ width: colWidths[header] || 200, minWidth: colWidths[header] || 200 }}
                                              onContextMenu={(e) => handleHeaderContextMenu(e, header)}
                                           >
                                              <div className="flex items-start justify-between h-full">
                                                 <span>{header}</span>
                                                 {header === selectedPhoneColumn && (
                                                    <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1 shrink-0 mt-0.5">Phone</Badge>
                                                 )}
                                              </div>
                                              <div 
                                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary z-10"
                                                onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  setResizingCol({ header, startX: e.clientX, startWidth: colWidths[header] || 200 });
                                                }}
                                              />
                                           </TableHead>
                                        ))}
                                        {/* New Columns */}
                                        <TableHead className="sticky right-[140px] z-20 bg-card shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[140px] font-bold text-foreground border-l">
                                            Status Sending
                                        </TableHead>
                                        <TableHead className="sticky right-0 z-20 bg-card w-[140px] font-bold text-foreground border-l">
                                            Trigger Time
                                        </TableHead>
                                     </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                     {filteredData.map((row, displayIndex) => {
                                        const rowIndex = row._originalIndex;
                                        const rowPhone = normalizePhone(row[selectedPhoneColumn]);
                                        const isDuplicate = duplicatePhones.has(rowPhone);
                                        
                                        return (
                                        <TableRow 
                                          key={rowIndex} 
                                          className={isDuplicate ? "bg-amber-50/50 hover:bg-amber-100/50 cursor-context-menu" : "hover:bg-transparent cursor-context-menu"}
                                          onContextMenu={(e) => handleRowContextMenu(e, rowIndex)}
                                        >
                                           <TableCell className="font-mono text-xs text-muted-foreground align-top py-2">{rowIndex + 1}</TableCell>
                                           {headers.filter(h => h !== 'Status' && h !== 'Trigger time').map((header) => {
                                              const getSafeValue = (val: any) => {
                                                  if (val === null || val === undefined) return '';
                                                  return String(val).trim();
                                              };

                                              const isPhoneColumn = header === selectedPhoneColumn;
                                              const cellValue = getSafeValue(row[header]);
                                              const isMatch = searchTerm && cellValue.toLowerCase().includes(searchTerm.toLowerCase());

                                              return (
                                                  <TableCell 
                                                    key={`${rowIndex}-${header}`} 
                                                    className={`p-0 align-top border-b border-muted/50 ${isPhoneColumn && isDuplicate ? "bg-amber-100/50" : ""} ${isMatch ? "bg-yellow-100/50 dark:bg-yellow-900/20" : ""}`}
                                                    style={{ width: colWidths[header] || 200, minWidth: colWidths[header] || 200 }}
                                                  >
                                                      <CellTextarea
                                                        className={`rounded-none border-0 border-b border-transparent bg-transparent px-3 py-2 shadow-none focus-visible:ring-0 focus-visible:border-primary focus-visible:bg-muted/20 hover:bg-muted/20 transition-colors resize-none overflow-hidden ${getRowHeightClass()}`}
                                                        value={cellValue}
                                                        onChange={(e: any) => handleCellEdit(rowIndex, header, e.target.value)}
                                                    />
                                                  </TableCell>
                                               );
                                           })}
                                           <TableCell className="sticky right-[140px] z-20 bg-card shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-xs align-top py-2 font-medium border-l">
                                              {getPreviewStatus(row)}
                                           </TableCell>
                                           <TableCell className="sticky right-0 z-20 bg-card text-xs align-top py-2 font-medium border-l">
                                              {getRowTriggerTimeDisplay(row)}
                                           </TableCell>
                                        </TableRow>
                                     )})}
                                  </TableBody>
                               </Table>
                            </div>
                            <ScrollBar orientation="horizontal" />
                         </ScrollArea>
                      ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                            <div className="bg-muted/30 rounded-full p-6 mb-4">
                               <File className="h-12 w-12 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-lg font-medium">No Data to Preview</h3>
                            <p className="text-sm text-muted-foreground/60 mt-2 max-w-xs">
                               Upload a CSV, XLS, or XLSX file or paste a Google Sheet URL to view its contents here.
                            </p>
                         </div>
                      )}
                      {/* Custom Context Menu */}
                      {contextMenu?.visible && (
                        <div 
                          className="fixed z-50 w-48 bg-popover text-popover-foreground border rounded-md shadow-md p-1"
                          style={{ top: contextMenu.y, left: contextMenu.x }}
                        >
                          {contextMenu.type === 'row' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full justify-start" 
                                onClick={handleAddRow}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Row Below
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" 
                                onClick={handleDeleteRow}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Row
                              </Button>
                            </>
                          )}
                          {contextMenu.type === 'header' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" 
                              onClick={handleDeleteColumn}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Column
                            </Button>
                          )}
                        </div>
                      )}
                   </CardContent>
                </Card>
             </div>
          </TabsContent>

          {/* In-App Notifications Tab */}
          <TabsContent value="in-app" className="mt-6">
             <Card className="max-w-2xl mx-auto">
                <CardHeader>
                   <CardTitle>Send In-App Notification</CardTitle>
                   <CardDescription>Send a broadcast notification to all users or specific segments of your user base.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-2">
                      <Label>Recipient Target</Label>
                      <Select value={notifTarget} onValueChange={(v: any) => setNotifTarget(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="role">Specific Role</SelectItem>
                          <SelectItem value="specific">Specific Users</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>

                   {notifTarget === 'role' && (
                     <div className="space-y-2 animate-in slide-in-from-top-1 fade-in duration-300">
                        <Label>Select Role</Label>
                        <Select value={notifRole} onValueChange={setNotifRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                   )}

                   {notifTarget === 'specific' && (
                     <div className="space-y-2 animate-in slide-in-from-top-1 fade-in duration-300">
                        <Label>Select Users</Label>
                        <MultiSelect
                          options={profiles}
                          value={notifUsers}
                          onChange={setNotifUsers}
                          placeholder="Select users..."
                        />
                     </div>
                   )}

                   <div className="space-y-2">
                      <Label>Notification Title</Label>
                      <Input 
                        placeholder="e.g. System Maintenance Alert" 
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                      />
                   </div>

                   <div className="space-y-2">
                      <Label>Notification Body</Label>
                      <div className="bg-muted/30 p-2 rounded-md mb-2 text-xs text-muted-foreground flex gap-2 items-start">
                         <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                         <div className="space-y-1">
                            <span className="font-medium text-blue-600 block">AI Agent Active</span>
                            <span>Use <code>{`{{name}}`}</code> in your message. The selected users will automatically become the name variable, and the AI will <strong>rewrite and personalize</strong> the message for each user, adding relevant emojis.</span>
                         </div>
                      </div>
                      <Textarea 
                        ref={notifBodyRef}
                        placeholder="e.g. Hi {{name}}, the system will be undergoing maintenance..." 
                        value={notifBody}
                        onChange={(e) => setNotifBody(e.target.value)}
                        rows={4}
                      />
                      <div className="flex justify-start mt-1">
                         <Badge 
                            variant="outline" 
                            className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors font-mono text-[10px] px-1.5 py-0.5 flex items-center gap-1"
                            onClick={insertNotifVariable}
                         >
                            + {`{{name}}`}
                         </Badge>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <Label>Action Link (Optional)</Label>
                      <Input 
                        placeholder="e.g. /dashboard or https://..." 
                        value={notifLink}
                        onChange={(e) => setNotifLink(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">User will be redirected here when they click the notification.</p>
                   </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-6">
                   <Button variant="secondary" onClick={handleSendTestInAppNotification} disabled={isSendingTestNotif || isSendingNotif}>
                      {isSendingTestNotif ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
                      Send Test to Me
                   </Button>
                   <Button onClick={handleSendInAppNotification} disabled={isSendingNotif || isSendingTestNotif}>
                      {isSendingNotif ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                      Send In-App Broadcast
                   </Button>
                </CardFooter>
             </Card>
          </TabsContent>
        </Tabs>

        {/* Message Preview Dialog (WhatsApp) */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Message Preview</DialogTitle>
                    <DialogDescription>
                        Previewing based on your settings.
                        {duplicatesCount > 0 && (
                            <span className="block mt-1 text-amber-600 text-xs font-medium">
                                Note: {duplicatesCount} duplicate phone numbers will be skipped automatically.
                            </span>
                        )}
                        {vipMode && (
                            <span className="block mt-1 text-blue-600 text-xs font-medium flex items-center gap-1">
                                <Crown className="w-3 h-3" /> VIP Mode Active: Sending will be slower with AI variations.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                {data.length > 0 ? (
                    <div className="bg-muted/50 p-4 rounded-lg border space-y-3 max-h-[400px] overflow-y-auto">
                        {/* Display info about range */}
                        {rowRange && (
                            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-2 rounded text-xs flex items-start gap-2">
                                <ListFilter className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <span>
                                    Sending restricted to rows: <strong>{rowRange}</strong>. 
                                    Only rows within this range will be processed.
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-start">
                             <div className="mb-2">
                                <Label className="text-xs text-muted-foreground uppercase">To Phone ({rowRange ? `Row ${previewIndices[0] + 1}` : 'First Record'})</Label>
                                <p className="font-mono text-sm">{previewRow ? (previewRow[selectedPhoneColumn] || "N/A") : "N/A"}</p>
                                {rowRange && <p className="text-[10px] text-muted-foreground mt-1">List: {targetPhoneList}</p>}
                             </div>
                             <Badge variant="outline" className="capitalize">{messageType}</Badge>
                        </div>
                        {messageType !== 'text' && (
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase">Attachment</Label>
                                <p className="text-xs text-primary truncate font-mono bg-background p-1 rounded border mt-1">
                                    {previewRow ? (generatePreviewUrl(previewRow) || "No URL provided") : "No data"}
                                </p>
                            </div>
                        )}
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase">Message</Label>
                            <p className="text-sm whitespace-pre-wrap mt-1">{previewRow ? generatePreviewMessage(previewRow) : "No data to preview"}</p>
                            {vipMode && (
                                <div className="mt-2 text-[10px] text-muted-foreground italic bg-white p-1.5 rounded border">
                                    Note: In VIP Mode, this message will be slightly rewritten by AI for each recipient to ensure uniqueness.
                                </div>
                            )}
                        </div>
                        {isScheduled && previewRow && (
                            <div className="border-t border-dashed pt-2 mt-2">
                                <Label className="text-xs text-muted-foreground uppercase">Scheduled For</Label>
                                <p className="font-mono text-xs mt-1 flex items-center text-blue-600">
                                    <span className="mr-2">🕒</span>
                                    {scheduleMode === 'fixed' ? (
                                        `${fixedScheduleDate.replace('T', ' ')} (${fixedTimezone})`
                                    ) : (
                                        `Dynamic: ${previewRow[dynamicDateCol] || 'N/A'} ${dynamicTimeCol !== 'same_as_date' ? (previewRow[dynamicTimeCol] || '') : ''}`
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p>No data to preview.</p>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={isSending}>Cancel</Button>
                    <Button onClick={handleSendMessages} disabled={isSending}>
                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Confirm & Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Resend Confirmation Dialog */}
        <AlertDialog open={confirmResendOpen} onOpenChange={setConfirmResendOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Resend Confirmation</AlertDialogTitle>
                    <AlertDialogDescription>
                        <div className="space-y-3">
                            <p>
                                The following number(s) have already been marked as <strong>Sent</strong> or <strong>Scheduled</strong>:
                            </p>
                            <div className="max-h-[150px] overflow-y-auto p-2 bg-muted rounded border text-xs font-mono">
                                {duplicateRows.map(i => data[i][selectedPhoneColumn] || `Row ${i + 1}`).join(', ')}
                            </div>
                            <p>
                                Do you want to resend messages to these rows?
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmResendOpen(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmResend}>Yes, Resend All</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Save Campaign Dialog */}
        <Dialog open={saveCampaignOpen} onOpenChange={setSaveCampaignOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Save Campaign</DialogTitle>
              <DialogDescription>
                Save this Google Sheet URL as a campaign for easy access later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g. Monthly Newsletter"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sheet URL</Label>
                <Input
                  value={googleSheetUrl}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveCampaignOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveCampaign} disabled={!newCampaignName.trim()}>Save Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
};

export default PublicationPage;