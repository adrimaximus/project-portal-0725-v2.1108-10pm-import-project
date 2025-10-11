import Editor from "@/components/Editor";
import { useState } from "react";
import { EditorState } from "lexical";

const TestEditorPage = () => {
  const [editorState, setEditorState] = useState<string>();

  const handleOnChange = (editorState: EditorState) => {
    const editorStateJSON = JSON.stringify(editorState.toJSON());
    setEditorState(editorStateJSON);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Lexical Editor Demo</h1>
        <p className="mb-6 text-muted-foreground">
          This is a demonstration of the Lexical rich text editor.
        </p>
        <Editor onChange={handleOnChange} />
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Editor State (JSON)</h2>
          <div className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
            <pre><code>{editorState ? JSON.stringify(JSON.parse(editorState), null, 2) : 'Editor state will appear here...'}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEditorPage;