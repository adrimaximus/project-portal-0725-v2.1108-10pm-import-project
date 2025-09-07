import React from 'react';
import { Tag } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const TagItem = ({ tag, isVisible, onVisibilityChange }: { tag: Tag, isVisible: boolean, onVisibilityChange: (id: string, checked: boolean) => void }) => {
  return (
    <div className="flex items-center gap-2 p-1 rounded-md hover:bg-muted">
      <Checkbox
        id={`vis-${tag.id}`}
        checked={isVisible}
        onCheckedChange={(checked) => onVisibilityChange(tag.id, !!checked)}
        className="ml-2"
      />
      <label htmlFor={`vis-${tag.id}`} className="flex-1 text-sm font-medium leading-none cursor-pointer">
        {tag.name}
      </label>
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
    </div>
  );
};

interface KanbanColumnEditorProps {
  allTags: Tag[];
  columnOrder: string[];
  visibleColumnIds: string[];
  onSettingsChange: (newOrder: string[], newVisible: string[]) => void;
  onClose: () => void;
}

const KanbanColumnEditor = ({ allTags, visibleColumnIds, onSettingsChange, onClose }: KanbanColumnEditorProps) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleVisibilityChange = (id: string, checked: boolean) => {
    const newVisible = checked
      ? [...visibleColumnIds, id]
      : visibleColumnIds.filter(vid => vid !== id);

    const visibleTags = allTags
      .filter(t => newVisible.includes(t.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const hiddenTags = allTags
      .filter(t => !newVisible.includes(t.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    const newOrder = [...visibleTags.map(t => t.id), ...hiddenTags.map(t => t.id)];
    
    onSettingsChange(newOrder, newVisible);
  };

  const { visibleTags, hiddenTags } = React.useMemo(() => {
    const filteredTags = allTags.filter(tag =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const visible = filteredTags
      .filter(t => visibleColumnIds.includes(t.id))
      .sort((a, b) => a.name.localeCompare(b.name));
      
    const hidden = filteredTags
      .filter(t => !visibleColumnIds.includes(t.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { visibleTags: visible, hiddenTags: hidden };
  }, [allTags, visibleColumnIds, searchQuery]);

  return (
    <div className="p-2 flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-base font-semibold px-2">Customize Columns</h4>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative mb-2 px-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search columns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8"
        />
      </div>
      <div className="flex-1 overflow-y-auto pr-2 max-h-[calc(100vh-240px)]">
        <div className="space-y-1">
          {visibleTags.map(tag => (
            <TagItem
              key={tag.id}
              tag={tag}
              isVisible={true}
              onVisibilityChange={handleVisibilityChange}
            />
          ))}
        </div>
        
        {visibleTags.length > 0 && hiddenTags.length > 0 && (
          <Separator className="my-2" />
        )}

        <div className="space-y-1">
          {hiddenTags.map(tag => (
            <TagItem
              key={tag.id}
              tag={tag}
              isVisible={false}
              onVisibilityChange={handleVisibilityChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanColumnEditor;