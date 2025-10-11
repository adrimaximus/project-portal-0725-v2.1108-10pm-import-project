import { useState } from "react";
import Editor from "@/components/Editor";
import PortalLayout from "@/components/PortalLayout";
import type { OutputData } from "@editorjs/editorjs";

export default function EditorPage() {
  const [content, setContent] = useState<OutputData>();

  return (
    <PortalLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Editor.js in Dyad</h1>
        <Editor
          data={content}
          onChange={(data) => {
            console.log("Content updated:", data);
            setContent(data);
          }}
        />
        <pre className="mt-6 bg-muted p-4 rounded text-xs whitespace-pre-wrap">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    </PortalLayout>
  );
}