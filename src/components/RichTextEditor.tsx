"use client";

import React, { useEffect, useRef } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import { EDITOR_JS_TOOLS } from './editor/editor-tools';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onGenerate?: () => void;
  isGenerating?: boolean;
  prompt?: string;
}

const RichTextEditor = React.forwardRef<EditorJS, RichTextEditorProps>(({ value, onChange, placeholder, onGenerate, isGenerating, prompt }, ref) => {
  const editorInstanceRef = useRef<EditorJS | null>(null);
  const holderId = React.useId();

  useEffect(() => {
    if (!editorInstanceRef.current) {
      let initialData: OutputData;
      try {
        initialData = value ? JSON.parse(value) : { blocks: [] };
      } catch (error) {
        console.error("Invalid JSON in RichTextEditor value prop. Initializing with empty editor.", error);
        initialData = { blocks: [] };
      }

      const editor = new EditorJS({
        holder: holderId,
        tools: EDITOR_JS_TOOLS,
        data: initialData,
        placeholder: placeholder || 'Let`s write an awesome story!',
        async onChange(api, event) {
          const outputData = await api.saver.save();
          onChange(JSON.stringify(outputData));
        },
      });
      editorInstanceRef.current = editor;
    }

    return () => {
      if (editorInstanceRef.current?.destroy) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, [holderId]);

  useEffect(() => {
    if (editorInstanceRef.current && value) {
      editorInstanceRef.current.isReady.then(async () => {
        const currentData = await editorInstanceRef.current!.save();
        if (value !== JSON.stringify(currentData)) {
          try {
            const newData = JSON.parse(value);
            editorInstanceRef.current!.render(newData);
          } catch (e) {
            console.error("Error rendering new data in Editor.js", e);
          }
        }
      }).catch(e => console.error("Editor.js not ready for value update", e));
    }
  }, [value]);

  React.useImperativeHandle(ref, () => editorInstanceRef.current!, []);

  return (
    <div className="bg-background rounded-md border relative">
      {onGenerate && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-1 right-1 z-10">
                <Button onClick={onGenerate} disabled={isGenerating} size="icon" variant="ghost" className="h-8 w-8">
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span className="sr-only">{prompt || 'Generate with AI'}</span>
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{prompt || 'Generate with AI'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <div id={holderId} className="prose max-w-full p-4 [&_.ce-block__content]:max-w-full [&_.ce-toolbar__content]:max-w-full [&_h1]:mt-2 [&_h2]:mt-2 [&_h3]:mt-2 [&_h4]:mt-2 [&_h5]:mt-2 [&_h6]:mt-2" />
    </div>
  );
});

export default RichTextEditor;