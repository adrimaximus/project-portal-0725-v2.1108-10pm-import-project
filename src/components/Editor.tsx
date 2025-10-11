"use client";
import React, { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
// @ts-ignore
import Header from "@editorjs/header";
// @ts-ignore
import List from "@editorjs/list";
// @ts-ignore
import ParagraphWithAlignment from "editorjs-paragraph-with-alignment";
// @ts-ignore
import Delimiter from "@editorjs/delimiter";
// @ts-ignore
import ToggleBlock from 'editorjs-toggle-block';
// @ts-ignore
import Title from 'title-editorjs';
// @ts-ignore
import ImageTool from '@editorjs/image';
// @ts-ignore
import LinkTool from '@editorjs/link';
// @ts-ignore
import AttachesTool from '@editorjs/attaches';
import { supabase } from "@/integrations/supabase/client";
// @ts-ignore
import GroupImage from '@cychann/editorjs-group-image';
// @ts-ignore
import Table from '@editorjs/table';
// @ts-ignore
import Underline from '@editorjs/underline';
// @ts-ignore
import Marker from '@editorjs/marker';
// @ts-ignore
import InlineCode from '@editorjs/inline-code';
// @ts-ignore
import ChangeCase from 'editorjs-change-case';
// @ts-ignore
import TextVariantTune from '@editorjs/text-variant-tune';
// @ts-ignore
import DragDrop from 'editorjs-drag-drop';
// @ts-ignore
import Undo from 'editorjs-undo';

interface EditorProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
}

const Editor: React.FC<EditorProps> = ({ data, onChange }) => {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current && holderRef.current) {
      const editor = new EditorJS({
        holder: holderRef.current,
        autofocus: true,
        tools: {
          title: {
            class: Title,
            placeholder: 'Enter a title',
            inlineToolbar: true,
          },
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              levels: [1, 2, 3],
              defaultLevel: 2,
              placeholder: "Type heading...",
            },
            tunes: ['textVariantTune'],
          },
          paragraph: {
            class: ParagraphWithAlignment,
            inlineToolbar: true,
            tunes: ['textVariantTune'],
          },
          textVariantTune: TextVariantTune,
          list: {
            class: List,
            inlineToolbar: true,
          },
          table: {
            class: Table,
            inlineToolbar: true,
            config: {
              rows: 2,
              cols: 3,
            },
          },
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) {
                    throw new Error('You must be logged in to upload images.');
                  }

                  const formData = new FormData();
                  formData.append('image', file);

                  const response = await fetch('https://quuecudndfztjlxbrvyb.supabase.co/functions/v1/upload-editor-image', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: formData,
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'Image upload failed');
                  }

                  const result = await response.json();
                  return result;
                }
              }
            }
          },
          groupImage: {
            class: GroupImage,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) {
                    throw new Error('You must be logged in to upload images.');
                  }

                  const formData = new FormData();
                  formData.append('image', file);

                  const response = await fetch('https://quuecudndfztjlxbrvyb.supabase.co/functions/v1/upload-editor-image', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: formData,
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'Image upload failed');
                  }

                  const result = await response.json();
                  return result;
                }
              }
            }
          },
          link: {
            class: LinkTool,
            config: {
              endpoint: 'https://quuecudndfztjlxbrvyb.supabase.co/functions/v1/fetch-url-metadata',
            }
          },
          attaches: {
            class: AttachesTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) {
                    throw new Error('You must be logged in to upload files.');
                  }

                  const formData = new FormData();
                  formData.append('file', file);

                  const response = await fetch('https://quuecudndfztjlxbrvyb.supabase.co/functions/v1/upload-editor-file', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: formData,
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'File upload failed');
                  }

                  const result = await response.json();
                  return result;
                }
              }
            }
          },
          delimiter: Delimiter,
          toggle: {
            class: ToggleBlock,
            inlineToolbar: true,
          },
          underline: Underline,
          marker: {
            class: Marker,
            shortcut: 'CMD+SHIFT+M',
          },
          inlineCode: {
            class: InlineCode,
            shortcut: 'CMD+SHIFT+C',
          },
          changeCase: ChangeCase,
        },
        data: data || {},
        onChange: async (api, event) => {
          if (onChange) {
            const content = await api.saver.save();
            onChange(content);
          }
        },
        onReady: () => {
          new Undo({ editor });
          new DragDrop(editor);
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
        ref={holderRef}
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