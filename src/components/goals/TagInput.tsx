import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Edit, X } from "lucide-react";
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
import { Tag, User } from "@/types";
import TagEditorDialog from "./TagEditorDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";

interface TagInputProps {
  allTags: Tag[];
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onTagCreate: (tagName: string) => Tag;
  onTagsUpdated: () => void;
  user: User | null;
}

export function TagInput({ allTags, selectedTags, onTagsChange, onTagCreate, onTagsUpdated, user }: TagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingTag, setEditingTag] = React.useState<Tag | null>(null);

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

  const handleEdit = (e: React.MouseEvent, tag: Tag) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTag(tag);
    setIsEditorOpen(true);
    setOpen(false);
  };

  const handleSaveTag = async (updatedTag: Tag) => {
    const { error } = await supabase
      .from('tags')
      .update({ name: updatedTag.name, color: updatedTag.color })
      .eq('id', updatedTag.id);

    if (error) {
      toast.error("Failed to update tag.");
    } else {
      toast.success("Tag updated successfully.");
      onTagsUpdated();
      onTagsChange(selectedTags.map(st => st.id === updatedTag.id ? updatedTag : st));
      setIsEditorOpen(false);
      setEditingTag(null);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    const { error: goalTagsError } = await supabase.from('goal_tags').delete().eq('tag_id', tagId);
    if (goalTagsError) {
      toast.error("Failed to remove tag associations.");
      return;
    }

    const { error: tagsError } = await supabase.from('tags').delete().eq('id', tagId);
    if (tagsError) {
      toast.error("Failed to delete tag.");
    } else {
      toast.success("Tag deleted successfully.");
      onTagsUpdated();
      onTagsChange(selectedTags.filter(st => st.id !== tagId));
      setIsEditorOpen(false);
      setEditingTag(null);
    }
  };

  const filteredTags = allTags.filter(tag => 
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <>
      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-auto min-h-[40px]"
            >
              <div className="flex gap-1 flex-wrap">
                {selectedTags.length > 0 ? (
                  selectedTags.map(tag => (
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
                  ))
                ) : (
                  <span className="text-muted-foreground font-normal">Select tags...</span>
                )}
              </div>
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
              <ScrollArea className="h-[200px]">
                <CommandEmpty>
                  <div className="p-1">
                    <Button variant="ghost" className="w-full justify-start" onClick={handleCreate}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create "{inputValue}"
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
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
                      {tag.user_id === user?.id && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onMouseDown={(e) => e.preventDefault()} onClick={(e) => handleEdit(e, tag)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <TagEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        tag={editingTag}
        onSave={handleSaveTag}
        onDelete={handleDeleteTag}
      />
    </>
  );
}