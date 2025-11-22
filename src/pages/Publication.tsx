import { useState, useRef } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Info, PlayCircle, UploadCloud, MessageSquare, Bell, FileSpreadsheet, X, Link as LinkIcon, File, CheckCircle2, Loader2 } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const PublicationPage = () => {
  const [activeTab, setActiveTab] = useState("whatsapp");
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState<string>("");
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [templateMessage, setTemplateMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
          console.error(error);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleGoogleSheetImport = async () => {
    let exportUrl = "";

    // Logic for "Published to the web" URLs (containing /d/e/)
    if (googleSheetUrl.includes("/d/e/")) {
      if (googleSheetUrl.includes("/pubhtml")) {
        exportUrl = googleSheetUrl.replace("/pubhtml", "/pub?output=csv");
      } else if (googleSheetUrl.includes("/pub")) {
        const url = new URL(googleSheetUrl);
        url.searchParams.set("output", "csv");
        exportUrl = url.toString();
      } else {
        exportUrl = `${googleSheetUrl.replace(/\/$/, "")}/pub?output=csv`;
      }
    } 
    // Logic for standard Google Sheet URLs (containing /d/SHEET_ID)
    else {
      const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    if (!exportUrl) {
      toast({ title: "Invalid URL", description: "Please enter a valid Google Sheet URL.", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    
    try {
      // Use Supabase Edge Function as Proxy
      const { data: csvText, error } = await supabase.functions.invoke('proxy-google-sheet', {
        body: { url: exportUrl }
      });

      if (error) throw error;

      if (!csvText || typeof csvText !== 'string') {
        throw new Error("Empty or invalid response from proxy");
      }

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data as any[];
          if (parsedData.length > 0) {
            setHeaders(Object.keys(parsedData[0]));
            setData(parsedData);
            setFileName("Google Sheet Import");
            toast({ title: "Import Successful", description: `Imported ${parsedData.length} rows from Google Sheet.` });
          } else {
              toast({ title: "Empty Sheet", description: "No data found in the Google Sheet.", variant: "destructive" });
          }
        },
        error: (err) => {
          throw err;
        }
      });
    } catch (error: any) {
      console.error("Error fetching Google Sheet:", error);
      toast({ 
        title: "Import Failed", 
        description: "Could not fetch Google Sheet. Ensure it is publicly viewable (Anyone with the link) or check the URL.", 
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
    }
  };

  const clearData = () => {
    setData([]);
    setHeaders([]);
    setFileName(null);
    setSelectedPhoneColumn("");
    setGoogleSheetUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateMessages = () => {
    if (!templateMessage.trim()) {
        toast({ title: "Missing Template", description: "Please enter a message template.", variant: "destructive" });
        return;
    }
    setPreviewOpen(true);
  };

  const generatePreviewMessage = (row: any) => {
      let message = templateMessage;
      headers.forEach(header => {
          const regex = new RegExp(`{{${header}}}`, 'g');
          message = message.replace(regex, row[header] || '');
      });
      return message;
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
                            placeholder="Hi {{name}}, your payment of {{amount}} is due." 
                            className="min-h-[120px] font-mono text-sm"
                            value={templateMessage}
                            onChange={(e) => setTemplateMessage(e.target.value)}
                         />
                         <p className="text-xs text-muted-foreground">
                            Use <code className="bg-muted px-1 py-0.5 rounded text-foreground">{"{{column_name}}"}</code> for variables.
                            {headers.length > 0 ? (
                               <span className="text-green-600 ml-1">Available: {headers.map(h => `{{${h}}}`).join(", ")}</span>
                            ) : (
                               " Available columns will appear after upload."
                            )}
                         </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                         <div className="space-y-2">
                            <Label>Message Type</Label>
                            <Select defaultValue="text">
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
                              <Button variant="ghost" size="icon" onClick={clearData} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                 <X className="h-4 w-4" />
                              </Button>
                           </div>
                         )}
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                         <Switch id="schedule" />
                         <Label htmlFor="schedule" className="font-normal cursor-pointer">Schedule Messages (Optional)</Label>
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
                <Card className="h-[800px] flex flex-col shadow-sm overflow-hidden">
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

          <TabsContent value="in-app" className="mt-6">
             <Card>
                <CardHeader>
                   <CardTitle>Send In-App Notification</CardTitle>
                   <CardDescription>Send a notification to all users or specific segments.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-xl">
                      <Bell className="h-12 w-12 mb-4 opacity-20" />
                      <p>Feature coming soon...</p>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>

        {/* Message Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Message Preview</DialogTitle>
                    <DialogDescription>
                        Previewing the first generated message based on your data.
                    </DialogDescription>
                </DialogHeader>
                {data.length > 0 ? (
                    <div className="bg-muted/50 p-4 rounded-lg border">
                        <div className="mb-2">
                            <Label className="text-xs text-muted-foreground uppercase">To Phone</Label>
                            <p className="font-mono text-sm">{data[0][selectedPhoneColumn] || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase">Message</Label>
                            <p className="text-sm whitespace-pre-wrap mt-1">{generatePreviewMessage(data[0])}</p>
                        </div>
                    </div>
                ) : (
                    <p>No data to preview.</p>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
                    <Button onClick={() => { toast({ title: "Messages Queued", description: `${data.length} messages are being processed.` }); setPreviewOpen(false); }}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
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