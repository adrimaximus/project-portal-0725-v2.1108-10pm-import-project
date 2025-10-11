import Editor from "@/components/Editor";
import PortalLayout from "@/components/PortalLayout";
import { useState } from "react";
import { EditorState } from "lexical";

export default function TestEditorPage() {
  const [editorState, setEditorState] = useState<EditorState>();

  const handleEditorChange = (state: EditorState) => {
    setEditorState(state);
    // Anda sekarang dapat mengambil JSON atau teks dari state
    // const json = JSON.stringify(state.toJSON());
    // console.log(json);
  };

  return (
    <PortalLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Uji Lexical Editor</h2>
        <Editor onChange={handleEditorChange} />
      </div>
    </PortalLayout>
  );
}