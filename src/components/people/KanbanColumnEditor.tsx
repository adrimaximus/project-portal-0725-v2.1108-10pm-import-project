import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tag } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GripVertical, X } from 'lucide-react';

const SortableTagItem = ({ tag, isVisible, onVisibilityChange }: { tag: Tag, isVisible: boolean, onVisibilityChange: (id: string, checked: boolean) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tag.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-1 rounded-md hover:bg-muted">
      <div {...attributes} {...listeners} className="cursor-grab p-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Checkbox
        id={`vis-${tag.id}`}
        checked={isVisible}
        onCheckedChange={(checked) => onVisibilityChange(tag.id, !!checked)}
      />
      <label htmlFor={`vis-${tag.id}`} className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const sortedTags = React.useMemo(() => {
    const tagMap = new Map(allTags.map(t => [t.id, t]));
    return columnOrder.map(id => tagMap.get(id)).filter(Boolean) as Tag[];
  }, [allTags, columnOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
      onSettingsChange(newOrder, visibleColumnIds);
    }
  };

  const handleVisibilityChange = (id: string, checked: boolean) => {
    const newVisible = checked
      ? [...visibleColumnIds, id]
      : visibleColumnIds.filter(vid => vid !== id);
    onSettingsChange(columnOrder, newVisible);
  };

  return (
    <div className="p-2 flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-base font-semibold px-2">Customize Columns</h4>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 max-h-[calc(100vh-200px)]">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {sortedTags.map(tag => (
                <SortableTagItem
                  key={tag.id}
                  tag={tag}
                  isVisible={visibleColumnIds.includes(tag.id)}
                  onVisibilityChange={handleVisibilityChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default KanbanColumnEditor;