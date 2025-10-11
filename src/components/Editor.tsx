"use client";
import React, { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
import Paragraph from "editorjs-paragraph-with-alignment";

interface EditorProps {
  data?: OutputData;
  onChange: (data: OutputData) => void;
}

export default function Editor({ data, onChange }: EditorProps) {
  const ref = useRef<EditorJS | null>(null);

  useEffect(() => {
    async function init() {
      const { default: Header } = await import("@editorjs/header");
      const { default: List } = await import("@editorjs/list");
      const { default: Warning } = await import("@editorjs/warning");
      const { default: Delimiter } = await import("@editorjs/delimiter");
      const { default: Alert } = await import("editorjs-alert");

      if (!ref.current) {
        const editor = new EditorJS({
          holder: "editorjs",
          defaultBlock: 'paragraph',
          tools: { 
            paragraph: {
              class: Paragraph,
              inlineToolbar: true,
            },
            header: {
              class: Header,
              inlineToolbar: true,
            }, 
            list: {
              class: List,
              inlineToolbar: true,
            },
            alert: {
              class: Alert,
              inlineToolbar: true,
              shortcut: 'CMD+SHIFT+A',
              config: {
                defaultType: 'primary',
                messagePlaceholder: 'Enter something',
              },
            },
            warning: {
              class: Warning,
              inlineToolbar: true,
              shortcut: 'CMD+SHIFT+W',
              config: {
                titlePlaceholder: 'Title',
                messagePlaceholder: 'Message',
              },
            },
            delimiter: Delimiter,
          },
          data: data || { blocks: [] },
          async onChange(api, event) {
            const content = await editor.save();
            onChange(content);
          },
        });
        ref.current = editor;
      }
    }

    if (typeof window !== "undefined") {
      init();
    }

    return () => {
      if (ref.current && ref.current.destroy) {
        ref.current.destroy();
      }
      ref.current = null;
    };
  }, [data, onChange]);

  return (
    <div className="w-full border rounded-md p-4 bg-background text-foreground">
      <div id="editorjs" />
    </div>
  );
}