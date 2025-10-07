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

const EmailitPage = () => {
  const [apiKey, setApiKey] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testRecipient, setTestRecipient] = useState("");
  const [testSubject, setTestSubject] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const checkConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-emailit-credentials', { method: 'GET' });
      if (error) throw error;
      setIsConnected(data.connected);
    } catch (error: any) {
      console.error("Failed to check EmailIt connection status:", error.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const handleConnect = async () => {
    if (!apiKey || !senderEmail || !fromName) {
      toast.error("Please fill all credential fields.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-emailit-credentials', {
        body: { apiKey, senderEmail, fromName },
      });
      if (error) throw error;
      toast.success("Successfully connected to EmailIt!");
      setIsConnected(true);
      setApiKey("");
      setSenderEmail("");
      setFromName("");
    } catch (error: any) {
      let description = "An unknown error occurred.";
      if (error.context && typeof error.context.json === 'function') {
        try {
          const errorBody = await error.context.json();
          if (errorBody.error) {
            description = errorBody.error;
          }
        } catch (e) {
          description = "Failed to parse error response.";
        }
      } else {
        description = error.message;
      }
      toast.error("Failed to connect", { description });
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
      toast.info("Disconnected from EmailIt.");
      setIsConnected(false);
    } catch (error: any) {
      let description = "An unknown error occurred.";
      if (error.context && typeof error.context.json === 'function') {
        try {
          const errorBody = await error.context.json();
          if (errorBody.error) {
            description = errorBody.error;
          }
        } catch (e) {
          description = "Failed to parse error response.";
        }
      } else {
        description = error.message;
      }
      toast.error("Failed to disconnect", { description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testRecipient || !testSubject || !testMessage) {
      toast.error("Please fill all fields for the test email.");
      return;
    }
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to: testRecipient, subject: testSubject, html: testMessage },
      });
      if (error) throw error;
      if (!data.ok) throw new Error(data.data?.message || 'Failed to send email.');
      toast.success("Test email sent successfully!");
      setTestRecipient("");
      setTestSubject("");
      setTestMessage("");
    } catch (error: any) {
      let description = "An unknown error occurred.";
      if (error.context && typeof error.context.json === 'function') {
        try {
          const errorBody = await error.context.json();
          if (errorBody.error) {
            description = errorBody.error;
          }
        } catch (e) {
          description = "Failed to parse error response.";
        }
      } else {
        description = error.message;
      }
      toast.error("Failed to send test email", { description });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/settings">Settings</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/settings/integrations">Integrations</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>EmailIt</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">EmailIt Integration</h1>
            <p className="text-muted-foreground">Connect your EmailIt account to send emails.</p>
          </div>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : isConnected && <Badge variant="secondary">Connected</Badge>}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect to EmailIt</CardTitle>
            <CardDescription>Enter your EmailIt credentials to activate the integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="space-y-2">
                <Label htmlFor="sender-email">Sender Email</Label>
                <Input 
                  id="sender-email" 
                  type="email" 
                  placeholder={isConnected ? "••••••••••••••••••••••••" : "e.g., no-reply@yourdomain.com"}
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  disabled={isConnected || isLoading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="from-name">From Name</Label>
                <Input 
                  id="from-name" 
                  type="text" 
                  placeholder={isConnected ? "••••••••••••••••••••••••" : "e.g., Your App Name"}
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
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
              <Button onClick={handleConnect} disabled={!apiKey || !senderEmail || !fromName || isLoading}>
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
              <CardDescription>Verify your connection by sending a test email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="test-recipient">Recipient Email</Label>
                  <Input 
                    id="test-recipient" 
                    type="email" 
                    placeholder="e.g., test@example.com"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    disabled={isSendingTest}
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="test-subject">Subject</Label>
                  <Input 
                    id="test-subject" 
                    type="text" 
                    placeholder="Enter your test subject"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    disabled={isSendingTest}
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="test-message">Message (HTML)</Label>
                  <Textarea 
                    id="test-message" 
                    placeholder="<h1>Hello!</h1><p>This is a test email.</p>"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    disabled={isSendingTest}
                  />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSendTestMessage} disabled={!testRecipient || !testSubject || !testMessage || isSendingTest}>
                {isSendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Test Email
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default EmailitPage;