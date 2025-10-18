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

const EmailitIntegrationPage = () => {
  const [apiKey, setApiKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const checkConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-emailit-credentials', { method: 'GET' });
      if (error) throw error;
      setIsConnected(data.connected);
    } catch (error: any) {
      console.error("Failed to check Emailit connection status:", error.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const handleConnect = async () => {
    if (!apiKey) {
      toast.error("Please enter your Emailit API key.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-emailit-credentials', {
        body: { apiKey },
      });
      if (error) throw error;
      toast.success("Successfully connected to Emailit!");
      setIsConnected(true);
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
      const { error } = await supabase.functions.invoke('manage-emailit-credentials', {
        method: 'DELETE',
      });
      if (error) throw error;
      toast.info("Disconnected from Emailit.");
      setIsConnected(false);
    } catch (error: any) {
      toast.error("Failed to disconnect", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter a recipient email address.");
      return;
    }
    setIsSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('send-test-email', {
        body: { to: testEmail },
      });
      if (error) throw error;
      toast.success("Test email sent successfully!", {
        description: `An email has been sent to ${testEmail}.`,
      });
    } catch (error: any) {
      toast.error("Failed to send test email", { description: error.message });
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
              <BreadcrumbPage>Emailit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Emailit Integration</h1>
            <p className="text-muted-foreground">Connect your Emailit account for transactional emails.</p>
          </div>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : isConnected && <Badge variant="secondary">Connected</Badge>}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect to Emailit</CardTitle>
            <CardDescription>Enter your Emailit API key to activate email notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input 
                  id="api-key" 
                  type="password" 
                  placeholder={isConnected ? "••••••••••••••••••••••••" : "Enter your Emailit API Key"}
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
              <Button onClick={handleConnect} disabled={!apiKey || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Connect
              </Button>
            )}
          </CardFooter>
        </Card>

        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Send a Test Email</CardTitle>
              <CardDescription>Verify your connection by sending a test email to an address of your choice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="test-email">Recipient Email</Label>
              <Input 
                id="test-email" 
                type="email" 
                placeholder="Enter recipient's email address"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={isSendingTest}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSendTestEmail} disabled={!testEmail || isSendingTest}>
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

export default EmailitIntegrationPage;