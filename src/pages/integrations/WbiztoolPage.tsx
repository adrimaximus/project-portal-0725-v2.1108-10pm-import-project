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

const getErrorMessage = async (error: any): Promise<string> => {
  let description = "An unknown error occurred. Please check the console.";

  if (error.context && typeof error.context.json === 'function') {
    try {
      const errorBody = await error.context.json();
      description = errorBody.error || "The server returned an error without a specific message.";
    } catch (e) {
      // Failed to parse JSON. Let's check if it's an HTML page.
      if (error.context && typeof error.context.text === 'function') {
        try {
          const errorText = await error.context.text();
          if (errorText.trim().startsWith('<') || errorText.includes('<html>') || errorText.includes('window.dataLayer')) {
            return "The server returned an unexpected error. This might be a temporary issue with the service. Please try again later.";
          }
          // It's not JSON and not HTML, so it might be a plain text error.
          description = errorText;
        } catch (textError) {
          description = "Failed to parse the error response from the server.";
        }
      } else {
        description = "Failed to parse the error response from the server.";
      }
    }
  } else {
    description = error.message || "The server returned an error.";
  }

  // Clean up common error patterns from edge functions
  const prefixes = ['WBIZTOOL unexpected error:', 'WBIZTOOL API Error:', 'WBIZTOOL API Error (devices):', 'WBIZTOOL API Error (messages):'];
  for (const prefix of prefixes) {
    if (description.startsWith(prefix)) {
      description = description.substring(prefix.length).trim();
    }
  }

  // Provide user-friendly messages for specific technical errors
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

  // A simple HTML stripper for any leftover tags
  description = description.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  
  if (!description) {
    return "An unexpected server error occurred.";
  }

  return description;
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
      toast.error("Please enter both your API Client ID and API Key.");
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
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-wbiztool-message', {
        body: { phone: testPhone, message: testMessage },
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
            <CardDescription>Enter your WBIZTOOL API Client ID and API key to activate the integration.</CardDescription>
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