import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { apiKey, saveApiKey, isLoaded } = useSettings();
  const [currentKey, setCurrentKey] = useState(apiKey);

  useState(() => {
    if (isLoaded) {
      setCurrentKey(apiKey);
    }
  });

  const handleSave = () => {
    saveApiKey(currentKey);
    toast.success('API Key saved successfully!');
  };

  return (
    <PortalLayout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>AI Icon Generation</CardTitle>
          <CardDescription>
            Provide your API key for the AI image generation service. This will be stored securely in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={currentKey}
              onChange={(e) => setCurrentKey(e.target.value)}
              disabled={!isLoaded}
            />
          </div>
          <Button onClick={handleSave} disabled={!isLoaded}>Save API Key</Button>
        </CardContent>
      </Card>
    </PortalLayout>
  );
};

export default SettingsPage;