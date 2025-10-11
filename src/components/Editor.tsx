"use client";
import React, { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
// @ts-ignore
import HeaderWithAnchor from "editorjs-header-with-anchor";
// @ts-ignore
import List from "@editorjs/list";
// @ts-ignore
import ParagraphWithAlignment from "editorjs-paragraph-with-alignment";
// @ts-ignore
import Delimiter from "@editorjs/delimiter";
// @ts-ignore
import ToggleBlock from 'editorjs-toggle-block';
// @ts-ignore
import AIText from '@alkhipce/editorjs-aitext';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
          aiText: {
            class: AIText,
            config: {
              onGenerate: async (prompt: string) => {
                try {
                  const { data, error } = await supabase.functions.invoke('generate-ai-text', {
                    body: { prompt },
                  });

                  if (error) {
                    throw new Error(error.message);
                  }
                  if (data.error) {
                    throw new Error(data.error);
                  }

                  return data.text;
                } catch (error: any) {
                  toast.error("AI text generation failed.", { description: error.message });
                  return ""; // Return empty string on failure
                }
              },
            },
          },
          header: {
            class: HeaderWithAnchor,
            inlineToolbar: true,
            config: {
              levels: [1, 2, 3],
              defaultLevel: 2,
              placeholder: "Type heading...",
              anchor: true,
            },
          },
          paragraph: {
            class: ParagraphWithAlignment,
            inlineToolbar: true,
          },
          list: {
            class: List,
            inlineToolbar: true,
          },
          delimiter: Delimiter,
          toggle: {
            class: ToggleBlock,
            inlineToolbar: true,
          },
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
    <div className="w-full border rounded-md p-4 bg-white">
      <div
        id="editorjs"
        className="
          text-gray-800 leading-none
          [&_.ce-block]:my-1
          [&_.ce-header]:font-semibold
          [&_.ce-header[data-level='1']]:text-2xl
          [&_.ce-header[data-level='2']]:text-xl
          [&_.ce-header[data-level='3']]:text-lg
          [&_.ce-paragraph]:text-base
          [&_.ce-paragraph]:leading-tight
          [&_.ce-delimiter]:h-px
          [&_.ce-delimiter]:bg-gray-300
          [&_.ce-delimiter]:my-4
          [&_[data-alignment='left']]:text-left
          [&_[data-alignment='center']]:text-center
          [&_[data-alignment='right']]:text-right
        "
      />
    </div>
  );
};

export default Editor;