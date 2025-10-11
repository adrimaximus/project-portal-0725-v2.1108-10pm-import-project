"use client";
import React, { useState, useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin, TOGGLE_LINK_COMMAND } from "@lexical/react/LexicalLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  EditorState,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import { $createHeadingNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
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

// Toolbar lengkap
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatText = (format: "bold" | "italic" | "underline") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const insertList = (type: "bullet" | "number") => {
    editor.dispatchCommand(
      type === "bullet"
        ? INSERT_UNORDERED_LIST_COMMAND
        : INSERT_ORDERED_LIST_COMMAND,
      undefined
    );
  };

  const removeList = () => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);

  const insertHeading = (tag: "h1" | "h2" | "h3") => {
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
    <div className="flex flex-wrap items-center gap-2 border-b pb-2 mb-3 text-sm">
      <button onClick={() => formatText("bold")} className="px-2 py-1 hover:bg-muted rounded font-bold">B</button>
      <button onClick={() => formatText("italic")} className="px-2 py-1 hover:bg-muted rounded italic">I</button>
      <button onClick={() => formatText("underline")} className="px-2 py-1 hover:bg-muted rounded underline">U</button>
      <button onClick={() => insertHeading("h1")} className="px-2 py-1 hover:bg-muted rounded">H1</button>
      <button onClick={() => insertHeading("h2")} className="px-2 py-1 hover:bg-muted rounded">H2</button>
      <button onClick={() => insertHeading("h3")} className="px-2 py-1 hover:bg-muted rounded">H3</button>
      <button onClick={() => insertList("bullet")} className="px-2 py-1 hover:bg-muted rounded">• List</button>
      <button onClick={() => insertList("number")} className="px-2 py-1 hover:bg-muted rounded">1. List</button>
      <button onClick={removeList} className="px-2 py-1 hover:bg-muted rounded">× Clear List</button>
      <button onClick={insertLink} className="px-2 py-1 hover:bg-muted rounded text-primary">🔗 Link</button>
    </div>
  );
}

// Plugin untuk command menu "/"
function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const removeListener = editor.registerTextContentListener((text) => {
      const lastChar = text.slice(-1);
      if (lastChar === "/") {
        const selection = window.getSelection();
        const rect = selection?.getRangeAt(0)?.getBoundingClientRect();
        if (rect) {
          setPosition({ top: rect.bottom + window.scrollY, left: rect.left });
        }
        setShowMenu(true);
      } else {
        setShowMenu(false);
      }
    });
    return () => removeListener();
  }, [editor]);

  const insertBlock = (type: "heading" | "paragraph") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.deleteCharacter(true);
        const node =
          type === "heading"
            ? $createHeadingNode("h2")
            : $createParagraphNode();
        selection.insertNodes([node]);
      }
    });
    setShowMenu(false);
  };

  const insertList = (type: "bullet" | "number") => {
    editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            selection.deleteCharacter(true);
        }
    });
    editor.dispatchCommand(
        type === "bullet"
          ? INSERT_UNORDERED_LIST_COMMAND
          : INSERT_ORDERED_LIST_COMMAND,
        undefined
    );
    setShowMenu(false);
  }

  return (
    showMenu && (
      <div
        style={{
          position: "absolute",
          top: position.top + 5,
          left: position.left,
        }}
        className="z-50 bg-background border rounded-md shadow-lg p-2 w-40"
      >
        <button onClick={() => insertBlock("heading")} className="block w-full text-left px-2 py-1 hover:bg-muted rounded">
          H2 Heading
        </button>
        <button onClick={() => insertBlock("paragraph")} className="block w-full text-left px-2 py-1 hover:bg-muted rounded">
          Paragraph
        </button>
        <button onClick={() => insertList("bullet")} className="block w-full text-left px-2 py-1 hover:bg-muted rounded">
          • Bulleted List
        </button>
        <button onClick={() => insertList("number")} className="block w-full text-left px-2 py-1 hover:bg-muted rounded">
          1. Numbered List
        </button>
      </div>
    )
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
    namespace: "BetterworksEditorNotion",
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
          contentEditable={
            <ContentEditable className="min-h-[200px] outline-none prose dark:prose-invert max-w-none" />
          }
          placeholder={<div className="text-muted-foreground absolute top-[62px] left-4 select-none pointer-events-none">Type “/” for commands...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <SlashCommandPlugin />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleOnChange} />
      </div>
    </LexicalComposer>
  );
}