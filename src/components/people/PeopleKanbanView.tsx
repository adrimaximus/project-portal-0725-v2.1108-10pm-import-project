import React, { useMemo, useRef, useState, useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Person, Tag } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import PeopleKanbanColumn from './PeopleKanbanColumn';
import PeopleKanbanCard from './PeopleKanbanCard';

const PeopleKanbanView = ({ people, tags, onEditPerson, onDeletePerson }: { people: Person[], tags: Tag[], onEditPerson: (person: Person) => void, onDeletePerson: (person: Person) => void }) => {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const dragHappened = useRef(false);
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);

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
    return [{ id: 'uncategorized', name: 'Uncategorized', color: '#9ca3af' }, ...tags];
  }, [tags]);

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