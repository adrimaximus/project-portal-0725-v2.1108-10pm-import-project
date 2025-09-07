import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, X } from "lucide-react";
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
import { ScrollArea } from "../ui/scroll-area";

interface TagInputProps {
  allTags: Tag[];
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onTagCreate: (tagName: string) => Tag;
}

export function KbTagInput({ allTags, selectedTags, onTagsChange, onTagCreate }: TagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleToggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some(st => st.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter(st => st.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
    setInputValue("");
  };

  const handleCreate = () => {
    if (inputValue && !allTags.some(t => t.name.toLowerCase() === inputValue.toLowerCase())) {
      const newTag = onTagCreate(inputValue);
      onTagsChange([...selectedTags, newTag]);
    }
    setInputValue("");
    setOpen(false);
  };

  const filteredTags = allTags.filter(tag => 
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-pointer"
          >
            <div className="flex-1 text-left">
              {selectedTags.length > 0 ? (
                <ScrollArea className="max-h-20 w-full">
                  <div className="flex gap-1 flex-wrap pr-2">
                    {selectedTags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="mr-1"
                        style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}
                      >
                        {tag.name}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleTag(tag); }}
                          className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <span className="text-muted-foreground font-normal">Select tags...</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput 
              placeholder="Search or create tag..." 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <ScrollArea className="h-[200px]">
              <CommandEmpty>
                {inputValue ? 'No tags found.' : 'Start typing to see tags.'}
              </CommandEmpty>
              
              {inputValue && !allTags.some(t => t.name.toLowerCase() === inputValue.toLowerCase()) && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreate}
                    className="cursor-pointer"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create "{inputValue}"
                  </CommandItem>
                </CommandGroup>
              )}
              
              {filteredTags.length > 0 && (
                <CommandGroup heading="Available Tags">
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleToggleTag(tag)}
                      className="flex justify-between items-center cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTags.some(st => st.id === tag.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {tag.name}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}