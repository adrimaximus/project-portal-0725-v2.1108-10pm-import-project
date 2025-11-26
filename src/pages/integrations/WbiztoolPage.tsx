import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getErrorMessage = async (error: any): Promise<string> => {
  let description = "An unknown error occurred. Please check the console.";
  let rawErrorText: string | null = null;

  if (error.context && typeof error.context.text === 'function') {
    rawErrorText = await error.context.text().catch(() => null);
  } else if (error.message) {
    rawErrorText = error.message;
  }

  if (rawErrorText) {
    if (rawErrorText.trim().startsWith('<') || rawErrorText.includes('<html>') || rawErrorText.includes('window.dataLayer')) {
      return "The server returned an unexpected error. This might be a temporary issue with the service. Please try again later.";
    }
    try {
      const errorBody = JSON.parse(rawErrorText);
      description = errorBody.error || errorBody.message || rawErrorText;
    } catch (e) {
      description = rawErrorText;
    }
  }

  const prefixes = ['WBIZTOOL unexpected error:', 'WBIZTOOL API Error:', 'WBIZTOOL API Error (devices):', 'WBIZTOOL API Error (messages):'];
  for (const prefix of prefixes) {
    if (description.startsWith(prefix)) {
      description = description.substring(prefix.length).trim();
    }
  }

  if (description.includes('404 Page Not Found')) {
    return "Could not reach the WBIZTOOL API. The service might be down or the API endpoint has changed. Please contact support if the issue persists.";
  }
  if (description.toLowerCase().includes('invalid credentials')) {
    return "Invalid credentials. Please double-check your API Client ID and API Key.";
  }
  if (description.includes('No active WBIZTOOL device found')) {
    return "No active WhatsApp device found in your WBIZTOOL account. Please ensure your device is connected in the WBIZTOOL dashboard.";
  }
  if (description.includes('credentials not fully configured')) {
      return "WBIZTOOL integration is not fully configured on the server. The 'WBIZTOOL_WHATSAPP_CLIENT_ID' might be missing.";
  }

  description = description.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  
  if (!description) {
    return "An unexpected server error occurred.";
  }

  return description;
};


const WbiztoolPage = () => {
  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [whatsappClientId, setWhatsappClientId] = useState(""); // For System Notifications
  const [publicationClientId, setPublicationClientId] = useState(""); // For Publication Blasts
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  const fetchDevices = useCallback(async (cId: string, k: string) => {
    setIsLoadingDevices(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-wbiztool-credentials', {
        body: { 
          action: 'fetch_devices',
          clientId: cId,
          apiKey: k 
        }
      });
      
      if (error) throw error;
      
      if (Array.isArray(data.devices)) {
        setDevices(data.devices);
        toast.success("Devices loaded", { description: `Found ${data.devices.length} WhatsApp device(s).` });
      } else {
        setDevices([]);
        toast.info("No devices found", { description: "Check your WBIZTOOL dashboard to ensure you have active WhatsApp clients." });
      }
    } catch (error: any) {
      console.error("Failed to fetch devices:", error);
      const description = await getErrorMessage(error);
      toast.error("Failed to load devices", { description });
    } finally {
      setIsLoadingDevices(false);
    }
  }, []);

  const checkConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-wbiztool-credentials', { method: 'GET' });
      if (error) throw error;
      setIsConnected(data.connected);
      
      if (data.connected) {
        if (data.whatsappClientId) setWhatsappClientId(data.whatsappClientId);
        if (data.publicationClientId) setPublicationClientId(data.publicationClientId);
        
        // Automatically fetch devices if connected to populate the list
        fetchDevices("", ""); // Backend will use stored credentials
      }
    } catch (error: any) {
      console.error("Failed to check WBIZTOOL connection status:", error.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchDevices]);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const handleConnect = async () => {
    if (!clientId || !apiKey || !whatsappClientId) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-wbiztool-credentials', {
        body: { clientId, apiKey, whatsappClientId, publicationClientId },
      });
      if (error) throw error;
      toast.success("Successfully connected to WBIZTOOL!");
      setIsConnected(true);
    } catch (error: any) {
      const description = await getErrorMessage(error);
      toast.error("Failed to connect", { description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-wbiztool-credentials', {
        method: 'DELETE',
      });
      if (error) throw error;
      toast.info("Disconnected from WBIZTOOL.");
      setIsConnected(false);
      setClientId("");
      setApiKey("");
      setWhatsappClientId("");
      setPublicationClientId("");
      setDevices([]);
    } catch (error: any) {
      const description = await getErrorMessage(error);
      toast.error("Failed to disconnect", { description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      toast.error("Please enter a phone number and a message.");
      return;
    }

    let normalizedPhone = testPhone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '62' + normalizedPhone.substring(1);
    } else if (normalizedPhone.startsWith('8')) {
      normalizedPhone = '62' + normalizedPhone;
    }

    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-wbiztool-message', {
        body: { phone: normalizedPhone, message: testMessage },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success("Test message sent successfully!", { description: data.message });
      setTestPhone("");
      setTestMessage("");
    } catch (error: any) {
      const description = await getErrorMessage(error);
      toast.error("Failed to send test message", { description });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/settings">Settings</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/settings/integrations">Integrations</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>WBIZTOOL</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">WBIZTOOL Integration</h1>
            <p className="text-muted-foreground">Connect your WBIZTOOL account for business automation.</p>
          </div>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : isConnected && <Badge variant="secondary">Connected</Badge>}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect to WBIZTOOL</CardTitle>
            <CardDescription>Enter your WBIZTOOL credentials to activate the integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="client-id">API Client ID</Label>
                <Input 
                  id="client-id" 
                  type="text" 
                  placeholder={isConnected ? "••••••••••••••••••••••••" : "Enter your API Client ID"}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={isConnected || isLoading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input 
                  id="api-key" 
                  type="password" 
                  placeholder={isConnected ? "••••••••••••••••••••••••" : "Enter your API Key"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isConnected || isLoading}
                />
            </div>
            
            <div className="flex items-center justify-end">
                {(!isConnected && clientId && apiKey) && (
                    <Button 
                        variant="link" 
                        className="h-auto p-0 text-xs" 
                        onClick={() => fetchDevices(clientId, apiKey)}
                        disabled={isLoadingDevices}
                    >
                        {isLoadingDevices ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <RefreshCw className="h-3 w-3 mr-1"/>}
                        Load WhatsApp Numbers
                    </Button>
                )}
            </div>

            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <div className="space-y-2">
                    <Label htmlFor="whatsapp-client-id">System Notification Number (Required)</Label>
                    <p className="text-[10px] text-muted-foreground">Used for system alerts like OTPs, mentions, and task reminders.</p>
                    
                    {devices.length > 0 || isConnected ? (
                        <Select 
                            value={whatsappClientId} 
                            onValueChange={setWhatsappClientId}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Device for Notifications" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.map((device: any) => (
                                    <SelectItem key={device.id} value={String(device.id)}>
                                        {device.phone || device.name || `Device ${device.id}`} 
                                        {device.status ? ` (${device.status})` : ''}
                                    </SelectItem>
                                ))}
                                {isConnected && whatsappClientId && !devices.find(d => String(d.id) === String(whatsappClientId)) && (
                                    <SelectItem value={whatsappClientId}>
                                        Saved Device ({whatsappClientId})
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input 
                          id="whatsapp-client-id" 
                          type="text" 
                          placeholder="Enter Device ID (e.g., 4162)"
                          value={whatsappClientId}
                          onChange={(e) => setWhatsappClientId(e.target.value)}
                          disabled={isConnected || isLoading}
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="publication-client-id">Publication Blast Number (Optional)</Label>
                    <p className="text-[10px] text-muted-foreground">Used exclusively for mass messaging and campaigns in the Publication page.</p>
                    
                    {devices.length > 0 || isConnected ? (
                        <Select 
                            value={publicationClientId} 
                            onValueChange={setPublicationClientId}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Device for Blasts (Default: Same as System)" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.map((device: any) => (
                                    <SelectItem key={device.id} value={String(device.id)}>
                                        {device.phone || device.name || `Device ${device.id}`} 
                                        {device.status ? ` (${device.status})` : ''}
                                    </SelectItem>
                                ))}
                                {isConnected && publicationClientId && !devices.find(d => String(d.id) === String(publicationClientId)) && (
                                    <SelectItem value={publicationClientId}>
                                        Saved Device ({publicationClientId})
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input 
                          id="publication-client-id" 
                          type="text" 
                          placeholder="Enter Device ID (Optional)"
                          value={publicationClientId}
                          onChange={(e) => setPublicationClientId(e.target.value)}
                          disabled={isConnected || isLoading}
                        />
                    )}
                </div>
            </div>

          </CardContent>
          <CardFooter className="flex justify-end">
            {isConnected ? (
              <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                      setIsConnected(false);
                      // Don't clear IDs so user can edit them
                  }}>
                      Edit Settings
                  </Button>
                  <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Disconnect
                  </Button>
              </div>
            ) : (
              <Button onClick={handleConnect} disabled={!clientId || !apiKey || !whatsappClientId || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Connect
              </Button>
            )}
          </CardFooter>
        </Card>

        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Send a Test Message</CardTitle>
              <CardDescription>Verify your connection by sending a test message (Uses System Notification Number).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="test-phone">Recipient Phone Number</Label>
                  <Input 
                    id="test-phone" 
                    type="text" 
                    placeholder="e.g., 6281234567890"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    disabled={isSendingTest}
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="test-message">Message</Label>
                  <Textarea 
                    id="test-message" 
                    placeholder="Enter your test message here"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    disabled={isSendingTest}
                  />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSendTestMessage} disabled={!testPhone || !testMessage || isSendingTest}>
                {isSendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Test Message
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default WbiztoolPage;