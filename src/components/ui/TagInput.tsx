"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from '@/lib/utils';
import { getColorForTag } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export const TagInput = ({ value, onChange, placeholder }: TagInputProps) => {
  const [inputValue, setInputValue] = React.useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      setInputValue("");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag, index) => {
          const color = getColorForTag(tag);
          return (
            <div
              key={index}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm border"
              style={{
                backgroundColor: `${color}20`,
                borderColor: color,
                color: color,
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => {
                  onChange(value.filter((_, i) => i !== index));
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Add a tag..."}
      />
    </div>
  );
};