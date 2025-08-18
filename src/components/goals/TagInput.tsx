import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const filteredTags = allTags.filter(tag => 
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (tag: Tag) => {
    if (!selectedTags.some(st => st.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    } else {
      onTagsChange(selectedTags.filter(st => st.id !== tag.id));
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
                      onClick={(e) => { e.stopPropagation(); handleRemove(tag); }}
                    >
                      {tag.name}
                      <span className="ml-1.5 text-xs">&times;</span>
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
            <div className="p-2">
              <Input 
                placeholder="Search or create tag..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            </div>
            <ScrollArea className="h-48">
              <div className="p-1">
                {filteredTags.length === 0 && inputValue && (
                  <Button variant="ghost" className="w-full justify-start" onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create "{inputValue}"
                  </Button>
                )}
                {filteredTags.map((tag) => (
                  <Button
                    variant="ghost"
                    key={tag.id}
                    onClick={() => handleSelect(tag)}
                    className="w-full justify-start mb-1"
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTags.some(st => st.id === tag.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{tag.name}</span>
                      </div>
                      {tag.user_id === user?.id && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleEdit(e, tag)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
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