"use client";
import React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  EditorState,
} from "lexical";

import { ListPlugin, ListItemNode, ListNode } from "@lexical/list";
import {
  LinkPlugin,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { Button } from "./ui/button";
import { Bold, Italic, Underline, Link as LinkIcon, Heading1, Heading2, Heading3 } from "lucide-react";

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

  const setHeading = (tag: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  const insertLink = () => {
    const url = prompt("Masukkan URL:");
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b pb-2 mb-3">
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}>
        <Underline className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => setHeading("h1")}>
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => setHeading("h2")}>
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => setHeading("h3")}>
        <Heading3 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={insertLink}>
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

function onError(error: Error) {
  console.error("Lexical Error:", error);
}

interface EditorProps {
  onChange?: (editorState: EditorState) => void;
  initialState?: string;
}

export default function Editor({ onChange, initialState }: EditorProps) {
  const initialConfig = {
    namespace: "BetterworksEditor",
    theme,
    onError,
    editable: true,
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
      <div className="relative border rounded-lg p-4 bg-background shadow-sm">
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={<ContentEditable className="min-h-[200px] outline-none prose dark:prose-invert max-w-none" />}
          placeholder={<div className="text-muted-foreground absolute top-[62px] left-4 select-none pointer-events-none">Type “/” for commands…</div>}
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