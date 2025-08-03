import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { apiKey, setApiKey } = useSettings();
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  const handleSave = () => {
    setApiKey(localApiKey);
    toast.success('API Key saved successfully!');
  };

  return (
    <div className="p-4 sm:p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your application settings and API keys here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your OpenAI API Key"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser. It is not sent to any server other than OpenAI.
            </p>
          </div>
          <Button onClick={handleSave}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;