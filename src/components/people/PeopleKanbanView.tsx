import React, { useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Person, Tag } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import PeopleKanbanColumn from './PeopleKanbanColumn';
import PeopleKanbanCard from './PeopleKanbanCard';
import KanbanColumnEditor from './KanbanColumnEditor';

type PeopleKanbanViewProps = {
  people: Person[];
  tags: Tag[];
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
};

type KanbanViewHandle = {
  openSettings: () => void;
};

const PeopleKanbanView = forwardRef<KanbanViewHandle, PeopleKanbanViewProps>(({ people, tags, onEditPerson, onDeletePerson }, ref) => {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const dragHappened = useRef(false);
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [internalPeople, setInternalPeople] = useState<Person[]>(people);
  
  const [collapseOverrides, setCollapseOverrides] = useState<Record<string, boolean>>({});
  
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const uncategorizedTag: Tag = { id: 'uncategorized', name: 'Uncategorized', color: '#9ca3af' };

  useEffect(() => {
    setInternalPeople(people);
  }, [people]);

  useImperativeHandle(ref, () => ({
    openSettings: () => setIsSettingsOpen(true),
  }));

  useEffect(() => {
    const savedOrder = localStorage.getItem('peopleKanbanColumnOrder');
    const savedVisible = localStorage.getItem('peopleKanbanVisibleColumns');
    
    const allDbTagIds = tags.map(t => t.id);
    
    let initialOrder: string[];
    if (savedOrder) {
      initialOrder = JSON.parse(savedOrder);
      const savedOrderSet = new Set(initialOrder);
      const newTags = allDbTagIds.filter(id => !savedOrderSet.has(id));
      initialOrder.push(...newTags);
    } else {
      initialOrder = ['uncategorized', ...allDbTagIds];
    }
    if (!initialOrder.includes('uncategorized')) {
      initialOrder.unshift('uncategorized');
    }
    setColumnOrder(initialOrder);

    const initialVisible = savedVisible ? JSON.parse(savedVisible) : ['uncategorized', ...allDbTagIds];
    setVisibleColumnIds(initialVisible);

  }, [tags]);

  const handleSettingsChange = (newOrder: string[], newVisible: string[]) => {
    setColumnOrder(newOrder);
    setVisibleColumnIds(newVisible);
    localStorage.setItem('peopleKanbanColumnOrder', JSON.stringify(newOrder));
    localStorage.setItem('peopleKanbanVisibleColumns', JSON.stringify(newVisible));
  };

  useEffect(() => {
    const savedState = localStorage.getItem('peopleKanbanCollapseOverrides');
    if (savedState) {
      setCollapseOverrides(JSON.parse(savedState));
    }
  }, []);

  const columns = useMemo(() => {
    const tagMap = new Map([...tags, uncategorizedTag].map(t => [t.id, t]));
    return columnOrder
      .filter(id => visibleColumnIds.includes(id))
      .map(id => tagMap.get(id))
      .filter(Boolean) as Tag[];
  }, [tags, columnOrder, visibleColumnIds, uncategorizedTag]);

  const personGroups = useMemo(() => {
    const groups: Record<string, Person[]> = {};
    columns.forEach(col => {
      groups[col.id] = [];
    });
    internalPeople.forEach(person => {
      const tagId = person.tags?.[0]?.id;
      const columnId = tagId && groups.hasOwnProperty(tagId) ? tagId : 'uncategorized';
      if (groups[columnId]) {
        groups[columnId].push(person);
      }
    });
    return groups;
  }, [internalPeople, columns]);

  const toggleColumnCollapse = (columnId: string) => {
    const peopleInColumn = personGroups[columnId] || [];
    const isCurrentlyCollapsed = collapseOverrides[columnId] ?? (peopleInColumn.length === 0);
    const newOverrides = { ...collapseOverrides, [columnId]: !isCurrentlyCollapsed };
    setCollapseOverrides(newOverrides);
    localStorage.setItem('peopleKanbanCollapseOverrides', JSON.stringify(newOverrides));
  };

  const handleDragStart = (event: DragStartEvent) => {
    dragHappened.current = true;
    const { active } = event;
    setActivePerson(internalPeople.find(p => p.id === active.id) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActivePerson(null);
    setTimeout(() => {
      dragHappened.current = false;
    }, 0);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const person = internalPeople.find(p => p.id === activeId);
    if (!person) return;

    const sourceContainerId = active.data.current?.sortable.containerId as string;
    const destContainerId = over.data.current?.sortable.containerId as string || over.id as string;

    if (sourceContainerId === destContainerId) {
      return;
    }

    const currentTags = person.tags || [];
    const destTag = tags.find(t => t.id === destContainerId);
    const otherTags = currentTags.filter(t => t.id !== sourceContainerId);
    const finalTags = destTag ? [destTag, ...otherTags] : otherTags;

    const originalPeople = [...internalPeople];
    const updatedPeople = internalPeople.map(p => {
      if (p.id === activeId) {
        return { ...p, tags: finalTags };
      }
      return p;
    });
    setInternalPeople(updatedPeople);

    try {
      const { error } = await supabase.rpc('upsert_person_with_details', {
        p_id: person.id,
        p_full_name: person.full_name,
        p_contact: person.contact || { emails: [], phones: [] },
        p_company: person.company,
        p_job_title: person.job_title,
        p_department: person.department,
        p_social_media: person.social_media,
        p_birthday: person.birthday,
        p_notes: person.notes,
        p_project_ids: person.projects?.map(p => p.id) || [],
        p_existing_tag_ids: finalTags.map(t => t.id),
        p_custom_tags: [],
        p_avatar_url: person.avatar_url,
        p_address: person.address || null,
        p_custom_properties: person.custom_properties || null,
      });

      if (error) throw error;

      toast.success(`Moved ${person.full_name}.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });

    } catch (error: any) {
      toast.error(`Failed to update tags: ${error.message}`);
      setInternalPeople(originalPeople);
    }
  };

  const allTagsForEditor = [uncategorizedTag, ...tags];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActivePerson(null)}>
      <div className="flex flex-row items-start gap-4 overflow-x-auto pb-4 h-full">
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isSettingsOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
          <div className="w-64 h-full bg-muted/50 rounded-lg border">
            <KanbanColumnEditor
              allTags={allTagsForEditor}
              columnOrder={columnOrder}
              visibleColumnIds={visibleColumnIds}
              onSettingsChange={handleSettingsChange}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        </div>

        {columns.map(tag => {
          const peopleInColumn = personGroups[tag.id] || [];
          const isColumnCollapsed = collapseOverrides[tag.id] ?? (peopleInColumn.length === 0);

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
});

export default PeopleKanbanView;