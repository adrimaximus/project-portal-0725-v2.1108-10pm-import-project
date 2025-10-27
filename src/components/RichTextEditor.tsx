"use client";

import React, { useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'quill-mention/dist/quill.mention.css';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import and register the mention module
import * as Mention from 'quill-mention';

// When importing a CommonJS module with a default export via an ES6 import,
// the actual export is often on the `default` property of the imported object.
Quill.register('modules/mention', (Mention as any).default);

interface MentionableUser {
  id: string;
  value: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onGenerate?: () => void;
  isGenerating?: boolean;
  prompt?: string;
  mentionableUsers?: MentionableUser[];
}

const RichTextEditor = React.forwardRef<ReactQuill, RichTextEditorProps>(({ value, onChange, placeholder, onGenerate, isGenerating, prompt, mentionableUsers = [] }, ref) => {
  const modules = useMemo(() => ({
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
    mention: {
      allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
      mentionDenotationChars: ["@"],
      source: (searchTerm: string, renderList: (matches: MentionableUser[], searchTerm: string) => void) => {
        if (searchTerm.length === 0) {
          renderList(mentionableUsers, searchTerm);
        } else {
          const matches = mentionableUsers.filter(user =>
            user.value.toLowerCase().includes(searchTerm.toLowerCase())
          );
          renderList(matches, searchTerm);
        }
      },
      renderItem: (item: MentionableUser) => {
        const initials = item.value.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        return `
          <div class="mention-item">
            <div class="mention-avatar">${initials}</div>
            <span>${item.value}</span>
          </div>
        `;
      },
    },
  }), [mentionableUsers]);

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