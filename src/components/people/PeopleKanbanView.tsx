import React, { useMemo, useRef, useState, useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Person, Tag } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import PeopleKanbanColumn from './PeopleKanbanColumn';
import PeopleKanbanCard from './PeopleKanbanCard';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import KanbanColumnEditor from './KanbanColumnEditor';

const PeopleKanbanView = ({ people, tags, onEditPerson, onDeletePerson }: { people: Person[], tags: Tag[], onEditPerson: (person: Person) => void, onDeletePerson: (person: Person) => void }) => {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const dragHappened = useRef(false);
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const savedOrder = localStorage.getItem('peopleKanbanColumnOrder');
    const savedVisible = localStorage.getItem('peopleKanbanVisibleColumns');
    
    const initialOrder = savedOrder ? JSON.parse(savedOrder) : tags.map(t => t.id);
    setColumnOrder(initialOrder);

    const initialVisible = savedVisible ? JSON.parse(savedVisible) : tags.map(t => t.id);
    setVisibleColumnIds(initialVisible);

    // Ensure order contains all tags, even new ones
    const allTagIds = new Set(tags.map(t => t.id));
    const currentOrderIds = new Set(initialOrder);
    const newTags = Array.from(allTagIds).filter(id => !currentOrderIds.has(id));
    if (newTags.length > 0) {
      setColumnOrder([...initialOrder, ...newTags]);
    }

  }, [tags]);

  const handleSettingsChange = (newOrder: string[], newVisible: string[]) => {
    setColumnOrder(newOrder);
    setVisibleColumnIds(newVisible);
    localStorage.setItem('peopleKanbanColumnOrder', JSON.stringify(newOrder));
    localStorage.setItem('peopleKanbanVisibleColumns', JSON.stringify(newVisible));
  };

  useEffect(() => {
    const savedState = localStorage.getItem('peopleKanbanCollapsedColumns');
    if (savedState) {
      setCollapsedColumns(JSON.parse(savedState));
    }
  }, []);

  const toggleColumnCollapse = (columnId: string) => {
    const newCollapsedColumns = collapsedColumns.includes(columnId)
      ? collapsedColumns.filter(id => id !== columnId)
      : [...collapsedColumns, columnId];
    setCollapsedColumns(newCollapsedColumns);
    localStorage.setItem('peopleKanbanCollapsedColumns', JSON.stringify(newCollapsedColumns));
  };

  const columns = useMemo(() => {
    const uncategorizedCol = { id: 'uncategorized', name: 'Uncategorized', color: '#9ca3af' };
    const tagMap = new Map(tags.map(t => [t.id, t]));
    
    const visibleTags = columnOrder
      .map(id => tagMap.get(id))
      .filter(tag => tag && visibleColumnIds.includes(tag.id)) as Tag[];

    return [uncategorizedCol, ...visibleTags];
  }, [tags, columnOrder, visibleColumnIds]);

  const personGroups = useMemo(() => {
    const groups: Record<string, Person[]> = {};
    columns.forEach(col => {
      groups[col.id] = [];
    });
    people.forEach(person => {
      const tagId = person.tags?.[0]?.id || 'uncategorized';
      if (groups[tagId]) {
        groups[tagId].push(person);
      } else {
        groups['uncategorized'].push(person);
      }
    });
    return groups;
  }, [people, columns]);

  const handleDragStart = (event: DragStartEvent) => {
    dragHappened.current = true;
    const { active } = event;
    setActivePerson(people.find(p => p.id === active.id) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActivePerson(null);
    setTimeout(() => {
      dragHappened.current = false;
    }, 0);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const person = people.find(p => p.id === activeId);
    if (!person) return;

    const sourceContainerId = active.data.current?.sortable.containerId as string;
    const destContainerId = over.data.current?.sortable.containerId as string || over.id as string;

    if (sourceContainerId === destContainerId) {
      return;
    }

    const tagToRemoveId = sourceContainerId === 'uncategorized' ? null : sourceContainerId;
    const tagToAddId = destContainerId === 'uncategorized' ? null : destContainerId;

    const originalPeople = [...people];
    const updatedPeople = people.map(p => {
      if (p.id === activeId) {
        let newTags = p.tags ? p.tags.filter(t => t.id !== tagToRemoveId) : [];
        if (tagToAddId) {
          const tagToAdd = tags.find(t => t.id === tagToAddId);
          if (tagToAdd) {
            newTags = [tagToAdd, ...newTags];
          }
        }
        return { ...p, tags: newTags };
      }
      return p;
    });
    queryClient.setQueryData(['people'], updatedPeople);

    const { error } = await supabase.rpc('update_person_tags', {
      p_person_id: person.id,
      p_tag_to_remove_id: tagToRemoveId,
      p_tag_to_add_id: tagToAddId,
    });

    if (error) {
      toast.error(`Failed to update tags: ${error.message}`);
      queryClient.setQueryData(['people'], originalPeople);
    } else {
      toast.success(`Moved ${person.full_name}.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActivePerson(null)}>
      <div className="flex flex-row items-start gap-4 overflow-x-auto pb-4 h-full">
        <div className="p-2 sticky left-0 bg-muted/50 z-10 rounded-lg border h-fit">
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isSettingsOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
          <div className="w-64 h-full bg-muted/50 rounded-lg border">
            <KanbanColumnEditor
              allTags={tags}
              columnOrder={columnOrder}
              visibleColumnIds={visibleColumnIds}
              onSettingsChange={handleSettingsChange}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        </div>

        {columns.map(tag => {
          const peopleInColumn = personGroups[tag.id] || [];
          const isColumnCollapsed = peopleInColumn.length === 0 && collapsedColumns.includes(tag.id);

          return (
            <PeopleKanbanColumn
              key={tag.id}
              tag={tag}
              people={peopleInColumn}
              dragHappened={dragHappened}
              onEditPerson={onEditPerson}
              onDeletePerson={onDeletePerson}
              isCollapsed={isColumnCollapsed}
              onToggleCollapse={toggleColumnCollapse}
            />
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {activePerson ? (
          <div className="w-72">
            <PeopleKanbanCard person={activePerson} dragHappened={dragHappened} onEdit={() => {}} onDelete={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default PeopleKanbanView;