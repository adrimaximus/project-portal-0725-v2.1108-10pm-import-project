"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Editor from './Editor';
import { type OutputData } from '@editorjs/editorjs';

interface RichTextEditorProps {
  data?: OutputData;
  onChange: (data: OutputData) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  prompt?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ data, onChange, onGenerate, isGenerating, prompt }) => {
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
      <Editor data={data} onChange={onChange} />
    </div>
  );
};

export default RichTextEditor;