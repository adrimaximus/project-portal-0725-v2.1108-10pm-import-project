"use client";
import * as React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  EditorState,
} from "lexical";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";

const theme = {
  paragraph: "mb-2",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
  },
  heading: {
    h1: "text-3xl font-bold mb-4",
    h2: "text-2xl font-bold mb-3",
    h3: "text-xl font-bold mb-2",
  },
  list: {
    ul: "list-disc list-inside mb-2",
    ol: "list-decimal list-inside mb-2",
  },
  link: "text-primary underline",
};

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  return (
    <div className="flex gap-2 border-b pb-1 mb-2 text-sm">
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className="px-2 py-1 hover:bg-muted rounded font-bold"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className="px-2 py-1 hover:bg-muted rounded italic"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        className="px-2 py-1 hover:bg-muted rounded underline"
      >
        U
      </button>
    </div>
  );
}

function onError(error: Error) {
  console.error("Lexical error:", error);
}

interface EditorProps {
  onChange?: (editorState: EditorState) => void;
  initialState?: string;
}

export default function Editor({ onChange, initialState }: EditorProps) {
  const initialConfig = {
    namespace: "DyadLexicalEditor",
    theme,
    onError,
    nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode, LinkNode],
    editorState: initialState,
  };

  const handleOnChange = (editorState: EditorState) => {
    if (onChange) {
      onChange(editorState);
    }
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border rounded-lg p-3 bg-background shadow-sm relative">
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="min-h-[150px] outline-none prose dark:prose-invert max-w-none"
            />
          }
          placeholder={
            <div className="text-muted-foreground absolute top-[46px] left-3 select-none pointer-events-none">
              Start typing here...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleOnChange} />
      </div>
    </LexicalComposer>
  );
}