import { useState, useRef } from "react";
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
import { Info, PlayCircle, UploadCloud, MessageSquare, Bell, FileSpreadsheet, X, Link as LinkIcon, File, CheckCircle2, Loader2, Send, RefreshCw } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

// Helper component for multi-select
import { MultiSelect } from "@/components/ui/multi-select";

const PublicationPage = () => {
  const [activeTab, setActiveTab] = useState("whatsapp");
  
  // WhatsApp State
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState<string>("");
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [templateMessage, setTemplateMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageType, setMessageType] = useState("text");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"fixed" | "dynamic">("fixed");
  const [fixedScheduleDate, setFixedScheduleDate] = useState("");
  const [fixedTimezone, setFixedTimezone] = useState("UTC");
  const [dynamicDateCol, setDynamicDateCol] = useState("");
  const [dynamicTimeCol, setDynamicTimeCol] = useState("same_as_date");
  const [dynamicTimezoneCol, setDynamicTimezoneCol] = useState("use_default");
  const [dynamicDefaultTimezone, setDynamicDefaultTimezone] = useState("UTC");
  const [dynamicDateFormat, setDynamicDateFormat] = useState("auto");

  // In-App Notification State
  const [notifTarget, setNotifTarget] = useState<"all" | "role" | "specific">("all");
  const [notifRole, setNotifRole] = useState("");
  const [notifUsers, setNotifUsers] = useState<string[]>([]);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifLink, setNotifLink] = useState("");
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

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
            setHeaders(Object.keys(parsedData[0]));
            setData(parsedData);
            toast({ title: "File uploaded", description: `Successfully parsed ${parsedData.length} rows.` });
          }
        },
        error: (error) => {
          toast({ title: "Error", description: "Failed to parse CSV file.", variant: "destructive" });
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
          setHeaders(Object.keys(jsonData[0] as object));
          setData(jsonData);
          toast({ title: "File uploaded", description: `Successfully parsed ${jsonData.length} rows.` });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({ title: "Invalid file type", description: "Please upload a CSV, XLS, or XLSX file.", variant: "destructive" });
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

    if (!exportUrl) { toast({ title: "Invalid URL", description: "Please enter a valid Google Sheet URL.", variant: "destructive" }); return; }

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
          if (parsedData.length > 0) { setHeaders(Object.keys(parsedData[0])); setData(parsedData); setFileName("Google Sheet Import"); toast({ title: "Import Successful", description: `Imported ${parsedData.length} rows from Google Sheet.` }); }
          else { toast({ title: "Empty Sheet", description: "No data found in the Google Sheet.", variant: "destructive" }); }
        },
        error: (err) => { throw err; }
      });
    } catch (error: any) { toast({ title: "Import Failed", description: "Could not fetch Google Sheet.", variant: "destructive" }); } finally { setIsImporting(false); }
  };

  const clearData = () => { setData([]); setHeaders([]); setFileName(null); setSelectedPhoneColumn(""); setGoogleSheetUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; };

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

  const handleGenerateMessages = () => {
    if (!templateMessage.trim()) { toast({ title: "Missing Template", description: "Please enter a message template.", variant: "destructive" }); return; }
    if (messageType !== 'text' && !mediaUrl.trim()) { toast({ title: "Missing URL", description: "Please enter a direct link for the file/image.", variant: "destructive" }); return; }
    if (isScheduled) {
        if (scheduleMode === 'fixed' && !fixedScheduleDate) { toast({ title: "Missing Date", description: "Please select a date and time for the schedule.", variant: "destructive" }); return; }
        if (scheduleMode === 'dynamic' && !dynamicDateCol) { toast({ title: "Missing Date Column", description: "Please select a column for scheduling dates.", variant: "destructive" }); return; }
    }
    setPreviewOpen(true);
  };

  const generatePreviewMessage = (row: any) => {
      let message = templateMessage;
      headers.forEach(header => { const regex = new RegExp(`{{${header}}}`, 'g'); message = message.replace(regex, row[header] || ''); });
      return message;
  };

  const handleSendMessages = async () => {
    setIsSending(true);
    toast({ title: "Sending...", description: "Processing your blast request." });

    try {
        const messages = data.map(row => {
            let phone = row[selectedPhoneColumn] ? String(row[selectedPhoneColumn]).replace(/\D/g, '') : '';
            if (phone.startsWith('0')) phone = '62' + phone.substring(1);
            if (phone.startsWith('8')) phone = '62' + phone;

            const messageData: any = { phone, message: generatePreviewMessage(row), type: messageType, url: mediaUrl };
            if (isScheduled) {
                if (scheduleMode === 'fixed') {
                    messageData.schedule_time = fixedScheduleDate.replace('T', ' ');
                    messageData.timezone = fixedTimezone;
                } else {
                    let sched = row[dynamicDateCol] || '';
                    if (dynamicTimeCol !== 'same_as_date' && row[dynamicTimeCol]) sched += ' ' + row[dynamicTimeCol];
                    messageData.schedule_time = sched.replace('T', ' ');
                    messageData.timezone = dynamicTimezoneCol !== 'use_default' && row[dynamicTimezoneCol] ? row[dynamicTimezoneCol] : dynamicDefaultTimezone;
                }
            }
            return messageData;
        }).filter(m => m.phone.length > 5);

        const { data: result, error } = await supabase.functions.invoke('send-whatsapp-blast', { body: { messages } });
        if (error) throw error;
        toast({ title: "Blast Completed", description: `Sent: ${result.success}, Failed: ${result.failed}`, variant: result.failed > 0 ? "default" : "default" });
        setPreviewOpen(false);
    } catch (error: any) { toast({ title: "Blast Failed", description: error.message, variant: "destructive" }); } finally { setIsSending(false); }
  };

  // In-App Notification Handler
  const handleSendInAppNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      toast({ title: "Missing Information", description: "Title and Body are required.", variant: "destructive" });
      return;
    }
    
    let targetValue: any = null;
    if (notifTarget === 'role') {
      if (!notifRole) { toast({ title: "Missing Role", description: "Please select a role.", variant: "destructive" }); return; }
      targetValue = notifRole;
    } else if (notifTarget === 'specific') {
      if (notifUsers.length === 0) { toast({ title: "Missing Users", description: "Please select at least one user.", variant: "destructive" }); return; }
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
      
      toast({ title: "Broadcast Sent", description: `Successfully sent to ${data.count} user(s).` });
      
      // Reset form
      setNotifTitle("");
      setNotifBody("");
      setNotifLink("");
      setNotifUsers([]);
    } catch (error: any) {
      toast({ title: "Broadcast Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSendingNotif(false);
    }
  };

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
                         <Label htmlFor="template" className="text-sm font-medium">
                            Message Template <span className="text-red-500">*</span>
                         </Label>
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
                                 {headers.map(h => (
                                   <Badge 
                                     key={h} 
                                     variant="outline" 
                                     className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors font-mono text-[10px] px-1.5 py-0.5"
                                     onClick={() => insertVariable(h)}
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

                      <div className="grid gap-4 sm:grid-cols-2">
                         <div className="space-y-2">
                            <Label>Message Type</Label>
                            <Select value={messageType} onValueChange={setMessageType}>
                               <SelectTrigger>
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
                                  {headers.map((header) => (
                                     <SelectItem key={header} value={header}>{header}</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                         </div>
                      </div>

                      {messageType !== 'text' && (
                          <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-dashed">
                              <Label className="text-xs uppercase text-muted-foreground font-semibold">
                                  {messageType === 'image' ? 'Image URL (JPG/PNG)' : 'Document URL (PDF/DOC)'} <span className="text-red-500">*</span>
                              </Label>
                              <div className="flex gap-2">
                                  <Input 
                                    value={mediaUrl} 
                                    onChange={e => setMediaUrl(e.target.value)} 
                                    placeholder="https://example.com/file.pdf" 
                                    className="text-sm"
                                  />
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                  Required by WBIZTOOL. Must be a direct, public link.
                              </p>
                          </div>
                      )}

                      {/* Import Section */}
                      <div className="space-y-3">
                         <Label>Import Data <span className="text-red-500">*</span></Label>
                         
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
                                <Button variant="secondary" onClick={handleGoogleSheetImport} disabled={!googleSheetUrl || isImporting}>
                                   {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-2" />}
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
                        <div className="flex items-center space-x-2">
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

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Date Column <span className="text-red-500">*</span></Label>
                                                <Select value={dynamicDateCol} onValueChange={setDynamicDateCol} disabled={headers.length === 0}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select date column" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
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
                                                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground">Column with time (HH:MM or HH:MM:SS)</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Timezone Column</Label>
                                                <Select value={dynamicTimezoneCol} onValueChange={setDynamicTimezoneCol} disabled={headers.length === 0}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Optional - use default" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="use_default">Optional - use default</SelectItem>
                                                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground">Column with timezone (UTC, US/Eastern, etc.)</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Default Timezone</Label>
                                                <Select value={dynamicDefaultTimezone} onValueChange={setDynamicDefaultTimezone}>
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
                                                <p className="text-[10px] text-muted-foreground">Used when timezone column is empty</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Date Format</Label>
                                                <Select value={dynamicDateFormat} onValueChange={setDynamicDateFormat}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Auto-detect" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="auto">Auto-detect</SelectItem>
                                                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground">Expected date format in CSV</p>
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
                            Create Messages
                         </Button>
                         <span className="text-xs text-muted-foreground">
                            {data.length > 0 ? `${data.length} messages ready` : "Upload data to begin"}
                         </span>
                      </div>
                   </CardContent>
                </Card>

                {/* Right Column: Preview */}
                <Card className="h-[400px] flex flex-col shadow-sm overflow-hidden">
                   <CardHeader className="border-b pb-4">
                      <CardTitle className="text-xl font-semibold">Data Preview</CardTitle>
                      <CardDescription>
                         {data.length > 0 
                            ? `Showing first 50 of ${data.length} rows` 
                            : "Upload a file to see the data preview"}
                      </CardDescription>
                   </CardHeader>
                   <CardContent className="p-0 flex-1 overflow-hidden relative">
                      {data.length > 0 ? (
                         <ScrollArea className="h-full w-full rounded-md">
                            <div className="w-max min-w-full p-4">
                               <Table>
                                  <TableHeader>
                                     <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[50px] font-bold text-foreground">#</TableHead>
                                        {headers.map((header) => (
                                           <TableHead key={header} className="font-bold text-foreground min-w-[80px]">
                                              {header}
                                              {header === selectedPhoneColumn && (
                                                 <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1">Phone</Badge>
                                              )}
                                           </TableHead>
                                        ))}
                                     </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                     {data.slice(0, 50).map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                           <TableCell className="font-mono text-xs text-muted-foreground">{rowIndex + 1}</TableCell>
                                           {headers.map((header) => (
                                              <TableCell 
                                                key={`${rowIndex}-${header}`} 
                                                className="text-sm max-w-[200px] break-words align-top py-2" 
                                                title={String(row[header] || '')}
                                              >
                                                 {row[header]}
                                              </TableCell>
                                           ))}
                                        </TableRow>
                                     ))}
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
                      <Textarea 
                        placeholder="e.g. The system will be undergoing maintenance on Sunday..." 
                        value={notifBody}
                        onChange={(e) => setNotifBody(e.target.value)}
                        rows={4}
                      />
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
                <CardFooter className="flex justify-end border-t pt-6">
                   <Button onClick={handleSendInAppNotification} disabled={isSendingNotif}>
                      {isSendingNotif ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Send Broadcast
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
                        Previewing the first generated message based on your data.
                    </DialogDescription>
                </DialogHeader>
                {data.length > 0 ? (
                    <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
                        <div className="flex justify-between items-start">
                             <div className="mb-2">
                                <Label className="text-xs text-muted-foreground uppercase">To Phone</Label>
                                <p className="font-mono text-sm">{data[0][selectedPhoneColumn] || "N/A"}</p>
                             </div>
                             <Badge variant="outline" className="capitalize">{messageType}</Badge>
                        </div>
                        {messageType !== 'text' && (
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase">Attachment</Label>
                                <p className="text-xs text-primary truncate font-mono bg-background p-1 rounded border mt-1">
                                    {mediaUrl || "No URL provided"}
                                </p>
                            </div>
                        )}
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase">Message</Label>
                            <p className="text-sm whitespace-pre-wrap mt-1">{generatePreviewMessage(data[0])}</p>
                        </div>
                        {isScheduled && (
                            <div className="border-t border-dashed pt-2 mt-2">
                                <Label className="text-xs text-muted-foreground uppercase">Scheduled For</Label>
                                <p className="font-mono text-xs mt-1 flex items-center text-blue-600">
                                    <span className="mr-2">🕒</span>
                                    {scheduleMode === 'fixed' ? (
                                        `${fixedScheduleDate.replace('T', ' ')} (${fixedTimezone})`
                                    ) : (
                                        `Dynamic: ${data[0][dynamicDateCol] || 'N/A'} (${dynamicDefaultTimezone})`
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
      </div>
    </PortalLayout>
  );
};

export default PublicationPage;