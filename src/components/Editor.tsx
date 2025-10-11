"use client";
import React, { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";

interface EditorProps {
  data?: OutputData;
  onChange: (data: OutputData) => void;
}

export default function Editor({ data, onChange }: EditorProps) {
  const ref = useRef<EditorJS | null>(null);

  useEffect(() => {
    async function init() {
      const { default: List } = await import("@editorjs/list");
      const { default: Warning } = await import("@editorjs/warning");
      const { default: Header } = await import("editorjs-header-with-alignment");
      const { default: Paragraph } = await import("editorjs-paragraph-with-alignment");
      const { default: Alert } = await import("editorjs-alert");
      const { default: Delimiter } = await import("editorjs-delimiter");

      if (!ref.current) {
        const editor = new EditorJS({
          holder: "editorjs",
          tools: {
            header: {
              class: Header,
              inlineToolbar: true,
              config: {
                placeholder: 'Enter a header',
                levels: [2, 3, 4],
                defaultAlignment: 'left'
              }
            },
            paragraph: {
              class: Paragraph,
              inlineToolbar: true,
            },
            list: {
              class: List,
              inlineToolbar: true,
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
            alert: {
              class: Alert,
              inlineToolbar: true,
              shortcut: 'CMD+SHIFT+A',
              config: {
                defaultType: 'info',
                messagePlaceholder: 'Enter something',
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