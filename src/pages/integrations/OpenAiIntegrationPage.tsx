import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const OpenAiIntegrationPage = () => {
  const [apiKey, setApiKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const storedStatus = localStorage.getItem("openai_connected");
    if (storedStatus === "true") {
      setIsConnected(true);
    }
  }, []);

  const handleConnect = () => {
    if (!apiKey) {
      toast.error("Please enter your OpenAI API key.");
      return;
    }
    // In a real app, you would validate the key with your backend here.
    localStorage.setItem("openai_connected", "true");
    setIsConnected(true);
    toast.success("Successfully connected to OpenAI!");
  };

  const handleDisconnect = () => {
    localStorage.removeItem("openai_connected");
    setIsConnected(false);
    setApiKey("");
    toast.info("Disconnected from OpenAI.");
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
              <BreadcrumbPage>OpenAI</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              OpenAI Integration
            </h1>
            <p className="text-muted-foreground">
              Connect your OpenAI account to leverage AI models.
            </p>
          </div>
          {isConnected && <Badge variant="secondary">Connected</Badge>}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect to OpenAI</CardTitle>
            <CardDescription>Enter your OpenAI API key to activate the integration. This will enable AI-powered features across the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input 
                  id="api-key" 
                  type="password" 
                  placeholder={isConnected ? "••••••••••••••••••••••••" : "sk-..."}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isConnected}
                />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            {isConnected ? (
              <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>
            ) : (
              <Button onClick={handleConnect} disabled={!apiKey}>Save and Connect</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default OpenAiIntegrationPage;