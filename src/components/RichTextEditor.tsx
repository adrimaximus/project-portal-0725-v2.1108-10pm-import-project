"use client";

import React from 'react';
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module-react';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

Quill.register('modules/imageResize', ImageResize);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onGenerate?: () => void;
  isGenerating?: boolean;
  prompt?: string;
}

const RichTextEditor = React.forwardRef<ReactQuill, RichTextEditorProps>(({ value, onChange, placeholder, onGenerate, isGenerating, prompt }, ref) => {
  const modules = {
    toolbar: [
      [{ 'font': [] }, { 'size': [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'header': '1' }, { 'header': '2' }, 'blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }, { 'align': [] }],
      ['link', 'image', 'video', 'formula'],
      ['clean']
    ],
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize', 'Toolbar']
    }
  };

  return (
    <div className="bg-background rounded-md border relative overflow-hidden">
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
      <ReactQuill
        ref={ref}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="[&_.ql-editor]:min-h-[120px] [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:border-none [&_.ql-toolbar]:pr-10"
      />
    </div>
  );
});

export default RichTextEditor;