"use client";

import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  aiOptions?: {
    title: string;
    startDate?: string | Date | null;
    dueDate?: string | Date | null;
    venue?: string | null;
    services?: string[];
  };
}

const RichTextEditor = React.forwardRef<ReactQuill, RichTextEditorProps>(({ value, onChange, placeholder, aiOptions }, ref) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  const handleGenerateBrief = async () => {
    if (!aiOptions) return;

    setIsGenerating(true);
    const toastId = toast.loading("Generating brief with AI...");

    try {
      const { data, error } = await supabase.functions.invoke('generate-brief', {
        body: {
          title: aiOptions.title,
          startDate: aiOptions.startDate,
          dueDate: aiOptions.dueDate,
          venue: aiOptions.venue,
          services: aiOptions.services,
        },
      });

      if (error) throw error;

      if (data.brief) {
        onChange(data.brief);
        toast.success("Brief generated successfully!", { id: toastId });
      } else {
        throw new Error("AI did not return a valid brief.");
      }
    } catch (error) {
      console.error("Failed to generate brief:", error);
      toast.error("Failed to generate brief.", {
        id: toastId,
        description: (error as Error).message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-background rounded-md border relative">
      {aiOptions && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-1 right-1 z-10">
                <Button onClick={handleGenerateBrief} disabled={isGenerating} size="icon" variant="ghost" className="h-8 w-8">
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span className="sr-only">Generate with AI</span>
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate with AI</p>
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