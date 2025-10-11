import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const [editorData, setEditorData] = useState('');
  const [savedData, setSavedData] = useState<any>(null);

  const handleSave = () => {
    try {
      const parsedData = JSON.parse(editorData);
      setSavedData(parsedData);
    } catch (e) {
      console.error("Error parsing editor data:", e);
      setSavedData({ error: "Invalid JSON data" });
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Rich Text Editor Demo</h1>
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RichTextEditor value={editorData} onChange={setEditorData} />
            <Button onClick={handleSave}>Save Data</Button>
          </CardContent>
        </Card>

        {savedData && (
          <Card>
            <CardHeader>
              <CardTitle>Saved Data (JSON Output)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
                <code>{JSON.stringify(savedData, null, 2)}</code>
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default Index;