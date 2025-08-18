import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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

  const handleSelect = (currentValue: string) => {
    const tag = allTags.find(t => t.name.toLowerCase() === currentValue.toLowerCase());
    if (tag && !selectedTags.some(st => st.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
    setOpen(false);
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

  const handleRemove = (tagToRemove: Tag) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagToRemove.id));
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
      // Update the tag in the selectedTags if it's there
      onTagsChange(selectedTags.map(st => st.id === updatedTag.id ? updatedTag : st));
      setIsEditorOpen(false);
      setEditingTag(null);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    // First, remove associations in goal_tags
    const { error: goalTagsError } = await supabase.from('goal_tags').delete().eq('tag_id', tagId);
    if (goalTagsError) {
      toast.error("Failed to remove tag associations.");
      return;
    }

    // Then, delete the tag itself
    const { error: tagsError } = await supabase.from('tags').delete().eq('id', tagId);
    if (tagsError) {
      toast.error("Failed to delete tag.");
    } else {
      toast.success("Tag deleted successfully.");
      onTagsUpdated();
      // Remove the tag from selectedTags if it's there
      onTagsChange(selectedTags.filter(st => st.id !== tagId));
      setIsEditorOpen(false);
      setEditingTag(null);
    }
  };

  return (
    <>
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
              <CommandList className="max-h-48">
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
                      className="flex justify-between items-center"
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
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleEdit(e, tag)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
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