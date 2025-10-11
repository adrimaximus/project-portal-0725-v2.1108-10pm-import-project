import Editor from "@/components/Editor";
import PortalLayout from "@/components/PortalLayout";
import { useState } from "react";
import type { OutputData } from "@editorjs/editorjs";

export default function TestEditorPage() {
  const [data, setData] = useState<OutputData>();

  return (
    <PortalLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Uji Editor.js</h2>
        <Editor data={data} onChange={setData} />
        <div className="mt-4 p-4 border rounded-md bg-muted">
          <h3 className="font-bold mb-2">Output JSON:</h3>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </PortalLayout>
  );
}