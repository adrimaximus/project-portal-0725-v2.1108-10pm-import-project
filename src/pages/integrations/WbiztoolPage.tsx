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
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const formatPhoneNumber = (phone: string): string => {
  const trimmedPhone = phone.trim();
  if (trimmedPhone.startsWith('+62')) {
    return '62' + trimmedPhone.substring(3);
  }
  if (trimmedPhone.startsWith('0')) {
    return '62' + trimmedPhone.substring(1);
  }
  return trimmedPhone;
};

const WbiztoolPage = () => {
  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const checkConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-wbiztool-credentials', { method: 'GET' });
      if (error) throw error;
      setIsConnected(data.connected);
    } catch (error: any) {
      console.error("Failed to check WBIZTOOL connection status:", error.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const handleConnect = async () => {
    if (!clientId || !apiKey) {
      toast.error("Please enter both your Client ID and API Key.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-wbiztool-credentials', {
        body: { clientId, apiKey },
      });
      if (error) throw error;
      toast.success("Successfully connected to WBIZTOOL!");
      setIsConnected(true);
      setClientId("");
      setApiKey("");
    } catch (error: any) {
      toast.error("Failed to connect", { description: error.message });
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
    } catch (error: any) {
      toast.error("Failed to disconnect", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      toast.error("Please enter a phone number and a message.");
      return;
    }
    setIsSendingTest(true);
    try {
      const formattedPhone = formatPhoneNumber(testPhone);
      const { data, error } = await supabase.functions.invoke('send-wbiztool-message', {
        body: { phone: formattedPhone, message: testMessage },
      });
      if (error) throw error;
      toast.success("Test message sent successfully!", { description: data.message });
      setTestPhone("");
      setTestMessage("");
    } catch (error: any) {
      toast.error("Failed to send test message", { description: error.message });
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
            <CardDescription>Enter your WBIZTOOL Client ID and API key to activate the integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="client-id">Client ID</Label>
                <Input 
                  id="client-id" 
                  type="text" 
                  placeholder={isConnected ? "••••••••••••••••••••••••" : "Enter your Client ID"}
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
          </CardContent>
          <CardFooter className="flex justify-end">
            {isConnected ? (
              <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnect} disabled={!clientId || !apiKey || isLoading}>
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
              <CardDescription>Verify your connection by sending a test message to a WhatsApp number.</CardDescription>
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