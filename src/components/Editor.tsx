"use client";
import React, { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Paragraph from "@editorjs/paragraph";
import Quote from "@editorjs/quote";
import Delimiter from "@editorjs/delimiter";

interface EditorProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
}

const Editor: React.FC<EditorProps> = ({ data, onChange }) => {
  const editorRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: "editorjs",
        autofocus: true,
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              levels: [1, 2, 3],
              defaultLevel: 2,
              placeholder: "Type heading...",
            },
          },
          paragraph: {
            class: Paragraph,
            inlineToolbar: true,
          },
          list: {
            class: List,
            inlineToolbar: true,
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
          },
          delimiter: Delimiter,
        },
        data: data || {},
        onChange: async () => {
          const content = await editor.saver.save();
          onChange && onChange(content);
        },
      });

      editorRef.current = editor;
    }

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        try {
          editorRef.current.destroy();
        } catch (e) {
          console.error("Error destroying Editor.js instance:", e);
        }
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full border rounded-md p-4 bg-background">
      <div
        id="editorjs"
        className="
          leading-snug
          [&_.ce-block]:my-2
          [&_.ce-header]:font-semibold
          [&_.ce-header[data-level='1']]:text-2xl
          [&_.ce-header[data-level='2']]:text-xl
          [&_.ce-header[data-level='3']]:text-lg
          [&_.ce-paragraph]:text-base
          [&_.ce-paragraph]:leading-tight
          [&_.ce-quote]:border-l-4
          [&_.ce-quote]:border-border
          [&_.ce-quote]:pl-3
          [&_.ce-quote]:italic
          [&_.ce-delimiter]:flex
          [&_.ce-delimiter]:justify-center
          [&_.ce-delimiter]:text-muted-foreground
          [&_.ce-delimiter]:before:content-['•••']
          [&_[data-alignment='left']]:text-left
          [&_[data-alignment='center']]:text-center
          [&_[data-alignment='right']]:text-right
        "
      />
    </div>
  );
};

export default Editor;