import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Tag = {
  id: string;
  text: string;
};

interface TagInputProps extends React.ComponentPropsWithoutRef<'input'> {
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
}

export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ tags, setTags, className, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const newTagText = inputValue.trim();
        if (newTagText && !tags.some(tag => tag.text === newTagText)) {
          setTags([...tags, { id: crypto.randomUUID(), text: newTagText }]);
        }
        setInputValue('');
      }
    };

    const removeTag = (idToRemove: string) => {
      setTags(tags.filter(tag => tag.id !== idToRemove));
    };

    return (
      <div>
        <div className={cn('flex flex-wrap gap-2 rounded-md border border-input p-2', className)}>
          {tags.map(tag => (
            <span key={tag.id} className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm">
              {tag.text}
              <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => removeTag(tag.id)}>
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
          <Input
            ref={ref}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none shadow-none focus-visible:ring-0"
            {...props}
          />
        </div>
      </div>
    );
  }
);

TagInput.displayName = 'TagInput';