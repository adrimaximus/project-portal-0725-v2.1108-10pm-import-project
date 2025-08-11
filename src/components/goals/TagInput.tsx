import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/types";

interface TagInputProps {
  allTags: Tag[];
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onTagCreate: (tagName: string) => Tag;
}

export function TagInput({ allTags, selectedTags, onTagsChange, onTagCreate }: TagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleSelect = (currentValue: string) => {
    const tag = allTags.find(t => t.name.toLowerCase() === currentValue.toLowerCase());
    if (tag && !selectedTags.some(st => st.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
    setOpen(false);
  };

  const handleCreate = () => {
    if (inputValue && !allTags.some(t => t.name.toLowerCase() === inputValue.toLowerCase())) {
      const newTag = onTagCreate(inputValue);
      onTagsChange([...selectedTags, newTag]);
    }
    setInputValue("");
    setOpen(false);
  };

  const handleRemove = (tagToRemove: Tag) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagToRemove.id));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Select tags...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput 
              placeholder="Search or create tag..." 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandEmpty>
              <Button variant="ghost" className="w-full justify-start" onClick={handleCreate}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create "{inputValue}"
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {allTags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={tag.name}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTags.some(st => st.id === tag.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tag.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-1">
        {selectedTags.map(tag => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => handleRemove(tag)}
            style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}
          >
            {tag.name} &times;
          </Badge>
        ))}
      </div>
    </div>
  );
}