import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Info, PlayCircle, UploadCloud, MessageSquare, Bell } from "lucide-react";

const PublicationPage = () => {
  const [activeTab, setActiveTab] = useState("whatsapp");

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
                <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-semibold">Create Template Messages</CardTitle>
                      <div className="flex gap-2">
                         <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 h-8 text-xs">
                            <PlayCircle className="mr-1 h-3.5 w-3.5" />
                            Watch Tutorial
                         </Button>
                         <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 h-8 text-xs">
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
                         />
                         <p className="text-xs text-muted-foreground">
                            Use <code className="bg-muted px-1 py-0.5 rounded text-foreground">{{column_name}}</code> for variables. Available columns will appear after CSV upload.
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
                                  <SelectItem value="image">Image Message</SelectItem>
                                  <SelectItem value="document">Document</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-2">
                            <Label>WhatsApp Account</Label>
                            <Select>
                               <SelectTrigger>
                                  <SelectValue placeholder="Select WhatsApp Account" />
                               </SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="primary">Primary Account</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <Label>Phone Number Column <span className="text-red-500">*</span></Label>
                         <Select disabled>
                            <SelectTrigger className="bg-muted/50 text-muted-foreground">
                               <SelectValue placeholder="Upload CSV to see columns" />
                            </SelectTrigger>
                            <SelectContent>
                               {/* Options will be populated after upload */}
                            </SelectContent>
                         </Select>
                         <p className="text-xs text-muted-foreground">Select which column contains phone numbers</p>
                      </div>

                      <div className="space-y-2">
                         <Label>Upload CSV File <span className="text-red-500">*</span></Label>
                         <div className="flex w-full items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                            <Button variant="secondary" size="sm" className="h-7 text-xs px-3">Choose File</Button>
                            <span className="text-muted-foreground text-xs">No file chosen</span>
                         </div>
                         <div className="flex gap-2 pt-1 items-center">
                            <Badge variant="secondary" className="rounded-sm font-normal text-[10px] px-1.5 h-5 bg-purple-100 text-purple-700 hover:bg-purple-100 border-0">CSV</Badge>
                            <Badge variant="secondary" className="rounded-sm font-normal text-[10px] px-1.5 h-5 bg-green-100 text-green-700 hover:bg-green-100 border-0">XLS</Badge>
                            <Badge variant="secondary" className="rounded-sm font-normal text-[10px] px-1.5 h-5 bg-green-100 text-green-700 hover:bg-green-100 border-0">XLSX</Badge>
                            <span className="text-xs text-muted-foreground ml-1">Supported formats: CSV, XLS, XLSX</span>
                         </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                         <Switch id="schedule" />
                         <Label htmlFor="schedule" className="font-normal cursor-pointer">Schedule Messages (Optional)</Label>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                         <Button className="bg-blue-500 hover:bg-blue-600 text-white min-w-[140px]">Create Messages</Button>
                         <span className="text-xs text-muted-foreground">46,072 messages remaining</span>
                      </div>
                   </CardContent>
                </Card>

                {/* Right Column: Preview */}
                <Card className="h-full flex flex-col border-dashed shadow-sm">
                   <CardHeader>
                      <CardTitle className="text-xl font-semibold">CSV Preview</CardTitle>
                   </CardHeader>
                   <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                      <div className="bg-muted/30 rounded-full p-6 mb-4">
                        <UploadCloud className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-lg font-medium text-muted-foreground">Upload a CSV file to see preview here</h3>
                      <p className="text-sm text-muted-foreground/60 mt-2">Supported formats: CSV, XLS, XLSX</p>
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
      </div>
    </PortalLayout>
  );
};

export default PublicationPage;