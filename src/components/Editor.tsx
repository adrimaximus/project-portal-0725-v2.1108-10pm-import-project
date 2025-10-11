"use client";
import React, { useState, useEffect, useRef } from "react";
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
  $createParagraphNode,
  EditorState,
} from "lexical";

import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ListNode, ListItemNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { HeadingNode, QuoteNode, $createHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { Button } from "./ui/button";
import { Bold, Italic, Underline, Link as LinkIcon, Heading1, Heading2, Heading3, List, ListOrdered } from "lucide-react";

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

function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const unregister = editor.registerTextContentListener((text) => {
      if (text.endsWith("/")) {
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
    return () => unregister();
  }, [editor]);

  const handleCommand = (cmd: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchor = selection.anchor;
      const node = anchor.getNode();
      if (node && node.getTextContent().endsWith("/")) {
        node.setTextContent(node.getTextContent().slice(0, -1));
      }

      if (cmd === "h1") $setBlocksType(selection, () => $createHeadingNode("h1"));
      else if (cmd === "h2") $setBlocksType(selection, () => $createHeadingNode("h2"));
      else if (cmd === "h3") $setBlocksType(selection, () => $createHeadingNode("h3"));
      else if (cmd === "paragraph") $setBlocksType(selection, () => $createParagraphNode());
    });

    if (cmd === "bullet") editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    if (cmd === "numbered") editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);

    editor.focus();
    setShowMenu(false);
  };

  const commands = [
    { label: "Heading 1", cmd: "h1", icon: Heading1 },
    { label: "Heading 2", cmd: "h2", icon: Heading2 },
    { label: "Heading 3", cmd: "h3", icon: Heading3 },
    { label: "Bullet List", cmd: "bullet", icon: List },
    { label: "Numbered List", cmd: "numbered", icon: ListOrdered },
  ];

  return (
    showMenu && (
      <div
        style={{ position: "absolute", top: position.top + 6, left: position.left }}
        className="z-50 bg-popover text-popover-foreground border rounded-md shadow-lg p-1 w-48"
      >
        <div className="text-xs text-muted-foreground p-2">Insert block</div>
        {commands.map(({ label, cmd, icon: Icon }) => (
          <button
            key={cmd}
            onClick={() => handleCommand(cmd)}
            className="flex items-center w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
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
        <SlashCommandPlugin />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleOnChange} />
      </div>
    </LexicalComposer>
  );
}