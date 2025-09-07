import React from 'react';
import { Tag } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X, Search, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTagItem = ({ tag, isVisible, onVisibilityChange }: { tag: Tag, isVisible: boolean, onVisibilityChange: (id: string, checked: boolean) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: tag.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1 p-1 rounded-md hover:bg-muted bg-background">
      <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab h-8 w-8">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Checkbox
        id={`vis-${tag.id}`}
        checked={isVisible}
        onCheckedChange={(checked) => onVisibilityChange(tag.id, !!checked)}
      />
      <label htmlFor={`vis-${tag.id}`} className="flex-1 text-sm font-medium leading-none cursor-pointer pl-2">
        {tag.name}
      </label>
      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
    </div>
  );
};

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

const KanbanColumnEditor = ({ allTags, columnOrder, visibleColumnIds, onSettingsChange, onClose }: KanbanColumnEditorProps) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ensure tags are unique to prevent rendering issues from duplicate data
  const uniqueTags = React.useMemo(() => {
    const seen = new Set<string>();
    return allTags.filter(tag => {
      if (seen.has(tag.id)) {
        return false;
      } else {
        seen.add(tag.id);
        return true;
      }
    });
  }, [allTags]);


  const handleVisibilityChange = (id: string, checked: boolean) => {
    const newVisibleIds = checked
      ? [...visibleColumnIds, id]
      : visibleColumnIds.filter(vid => vid !== id);

    const visibleTags = uniqueTags
      .filter(t => newVisibleIds.includes(t.id))
      .sort((a, b) => {
        const aIndex = columnOrder.indexOf(a.id);
        const bIndex = columnOrder.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

    const hiddenTags = uniqueTags
      .filter(t => !newVisibleIds.includes(t.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    const newOrder = [...visibleTags.map(t => t.id), ...hiddenTags.map(t => t.id)];
    
    onSettingsChange(newOrder, newVisibleIds);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldVisibleOrder = columnOrder.filter(id => visibleColumnIds.includes(id));
      const oldIndex = oldVisibleOrder.indexOf(active.id as string);
      const newIndex = oldVisibleOrder.indexOf(over.id as string);
      const newVisibleOrder = arrayMove(oldVisibleOrder, oldIndex, newIndex);

      const hiddenIds = columnOrder.filter(id => !visibleColumnIds.includes(id));
      const newOrder = [...newVisibleOrder, ...hiddenIds];
      onSettingsChange(newOrder, visibleColumnIds);
    }
  };

  const { visibleTags, hiddenTags } = React.useMemo(() => {
    const filteredTags = uniqueTags.filter(tag =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const visible = filteredTags
      .filter(t => visibleColumnIds.includes(t.id))
      .sort((a, b) => {
        const aIndex = columnOrder.indexOf(a.id);
        const bIndex = columnOrder.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
      
    const hidden = filteredTags
      .filter(t => !visibleColumnIds.includes(t.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { visibleTags: visible, hiddenTags: hidden };
  }, [uniqueTags, visibleColumnIds, columnOrder, searchQuery]);

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleTags.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {visibleTags.map(tag => (
                <SortableTagItem
                  key={tag.id}
                  tag={tag}
                  isVisible={true}
                  onVisibilityChange={handleVisibilityChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
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