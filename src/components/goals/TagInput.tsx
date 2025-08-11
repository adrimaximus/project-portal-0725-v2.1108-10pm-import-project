import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/types";
import { X } from "lucide-react";

interface TagInputProps {
  value: Tag[];
  onChange: (tags: Tag[]) => void;
  allTags: Tag[];
}

export default function TagInput({ value, onChange, allTags }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (trimmed && !value.some(t => t.name === trimmed)) {
      const existingTag = allTags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
      if (existingTag) {
        onChange([...value, existingTag]);
      } else {
        // For now, let's not create new tags from here, only select existing ones.
        // This can be extended later.
      }
    }
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const handleRemoveTag = (tagToRemove: Tag) => {
    onChange(value.filter(tag => tag.id !== tagToRemove.id));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
            {tag.name}
            <button onClick={() => handleRemoveTag(tag)}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add tags..."
      />
    </div>
  );
}