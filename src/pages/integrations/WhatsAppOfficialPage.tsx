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

const WhatsAppOfficialPage = () => {
  const [phoneId, setPhoneId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const checkConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-whatsapp-official-credentials', { method: 'GET' });
      if (error) throw error;
      setIsConnected(data.connected);
      if (data.connected) {
          if (data.phoneId) setPhoneId(data.phoneId);
          if (data.businessAccountId) setBusinessAccountId(data.businessAccountId);
          // We don't set access token for security visual reasons, or can set a dummy one
      }
    } catch (error: any) {
      console.error("Failed to check WhatsApp connection status:", error.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const handleConnect = async () => {
    if (!phoneId || !accessToken) {
      toast.error("Phone Number ID and Access Token are required.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-whatsapp-official-credentials', {
        body: { phoneId, businessAccountId, accessToken },
      });
      if (error) throw error;
      toast.success("Successfully saved credentials!");
      setIsConnected(true);
    } catch (error: any) {
      toast.error("Failed to save credentials", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-whatsapp-official-credentials', {
        method: 'DELETE',
      });
      if (error) throw error;
      toast.info("Credentials removed.");
      setIsConnected(false);
      setPhoneId("");
      setBusinessAccountId("");
      setAccessToken("");
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

    let normalizedPhone = testPhone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '62' + normalizedPhone.substring(1);
    } else if (normalizedPhone.startsWith('8')) {
      normalizedPhone = '62' + normalizedPhone;
    }

    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-whatsapp-official-message', {
        body: { phone: normalizedPhone, message: testMessage },
      });
      if (error) throw error;
      toast.success("Test message sent successfully!", { description: "Check your WhatsApp." });
      setTestMessage("");
    } catch (error: any) {
      let desc = error.message;
      // Try to parse nested JSON error from edge function if possible
      try {
        const json = JSON.parse(error.message);
        if (json.error && json.error.message) desc = json.error.message;
      } catch (e) { /* ignore */ }
      
      toast.error("Failed to send test message", { description: desc });
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
              <BreadcrumbPage>WhatsApp Official</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">WhatsApp Official API</h1>
            <p className="text-muted-foreground">Connect to Meta's Cloud API for reliable messaging.</p>
          </div>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : isConnected && <Badge variant="secondary">Configured</Badge>}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Enter your Meta app credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="phone-id">Phone Number ID</Label>
                <Input 
                  id="phone-id" 
                  type="text" 
                  placeholder="e.g. 103847..."
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                  disabled={isLoading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="business-account-id">WhatsApp Business Account ID</Label>
                <Input 
                  id="business-account-id" 
                  type="text" 
                  placeholder="e.g. 193752..."
                  value={businessAccountId}
                  onChange={(e) => setBusinessAccountId(e.target.value)}
                  disabled={isLoading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="access-token">Access Token</Label>
                <Input 
                  id="access-token" 
                  type="password" 
                  placeholder={isConnected ? "••••••••••••••••••••••••" : "EAA..."}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-[10px] text-muted-foreground">Use a Permanent Access Token for production.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
             <Button variant="outline" onClick={handleDisconnect} disabled={isLoading || !isConnected}>
                Remove
             </Button>
             <Button onClick={handleConnect} disabled={!phoneId || !accessToken || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Configuration
             </Button>
          </CardFooter>
        </Card>

        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Send a Test Message</CardTitle>
              <CardDescription>Verify your configuration.</CardDescription>
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
                    placeholder="Hello from 7i Portal!"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    disabled={isSendingTest}
                  />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSendTestMessage} disabled={!testPhone || !testMessage || isSendingTest}>
                {isSendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Test
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default WhatsAppOfficialPage;