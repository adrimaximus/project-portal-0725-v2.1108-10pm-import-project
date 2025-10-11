"use client";
import React, { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Paragraph from "@editorjs/paragraph";
import Quote from "@editorjs/quote";
import ImageTool from "@editorjs/image";
import "@/styles/editor.css";

interface EditorProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
}

const Editor: React.FC<EditorProps> = ({ data, onChange }) => {
  const editorRef = useRef<EditorJS | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep the ref updated with the latest onChange callback
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
            },
          },
          paragraph: {
            class: Paragraph,
            inlineToolbar: true,
          },
          list: List,
          quote: Quote,
          image: {
            class: ImageTool,
            config: {
              // These endpoints need to be implemented on your backend.
              // They are placeholders for now.
              endpoints: {
                byFile: "/uploadFile", 
                byUrl: "/fetchUrl",
              },
            },
          },
        },
        data: data || {},
        onChange: async (api, event) => {
          const content = await api.saver.save();
          if (onChangeRef.current) {
            onChangeRef.current(content);
          }
        },
      });

      editorRef.current = editor;
    }

    return () => {
      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        try {
          editorRef.current.destroy();
        } catch (e) {
          console.error("Error destroying Editor.js instance:", e);
        }
        editorRef.current = null;
      }
    };
  }, []); // Run only once on mount

  return (
    <div className="w-full border rounded-md p-4 bg-background">
      <div id="editorjs" className="max-w-none"></div>
    </div>
  );
};

export default Editor;