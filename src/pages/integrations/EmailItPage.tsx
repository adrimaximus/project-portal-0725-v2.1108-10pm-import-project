import React, { useState } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const EmailItPage = () => {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleConnect = () => {
    if (apiKey) {
      setIsConnected(true);
      toast.success('Connected to EmailIt successfully!');
    } else {
      toast.error('Please enter your API Key.');
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setApiKey('');
    toast.info('Disconnected from EmailIt.');
  };

  const handleSendTestEmail = async () => {
    if (!recipientEmail || !subject || !message) {
      toast.error('Please fill in all fields to send a test email.');
      return;
    }
    setIsSending(true);
    toast.info('Sending test email...');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log({
      recipientEmail,
      subject,
      message
    });

    toast.success(`Test email sent to ${recipientEmail}`);
    setIsSending(false);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings">Settings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings/integrations">Integrations</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>EmailIt</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              EmailIt Integration
              {isConnected && <Badge>Connected</Badge>}
            </h1>
            <p className="text-muted-foreground">
              Connect your EmailIt account to test email posts.
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect to EmailIt</CardTitle>
            <CardDescription>Enter your EmailIt API key to activate the integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input 
                id="api-key" 
                type="password" 
                placeholder="••••••••••••••••••••" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isConnected}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            {isConnected ? (
              <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
            ) : (
              <Button onClick={handleConnect}>Connect</Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send a Test Message</CardTitle>
            <CardDescription>Verify your connection by sending a test email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input 
                id="recipient-email" 
                placeholder="e.g., user@example.com" 
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={!isConnected}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                placeholder="Enter your test subject here" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!isConnected}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Enter your test message here" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!isConnected}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSendTestEmail} disabled={!isConnected || isSending}>
              {isSending ? 'Sending...' : 'Send Test Email'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default EmailItPage;