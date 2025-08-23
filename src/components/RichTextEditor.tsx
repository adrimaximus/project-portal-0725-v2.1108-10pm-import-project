"use client";

import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import gaya Quill

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = React.forwardRef<ReactQuill, RichTextEditorProps>(({ value, onChange, placeholder }, ref) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="bg-background rounded-md border">
        <ReactQuill
            ref={ref}
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            placeholder={placeholder}
            className="[&_.ql-editor]:min-h-[120px] [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:border-none"
        />
    </div>
  );
});

export default RichTextEditor;