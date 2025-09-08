import React, { useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, DragStartEvent, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { Person, Tag, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import PeopleKanbanColumn from './PeopleKanbanColumn';
import PeopleKanbanCard from './PeopleKanbanCard';
import KanbanColumnEditor from './KanbanColumnEditor';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );
  const dragHappened = useRef(false);
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  
  const [collapseOverrides, setCollapseOverrides] = useState<Record<string, boolean>>({});
  
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const uncategorizedTag: Tag = { id: 'uncategorized', name: 'Uncategorized', color: '#9ca3af' };

  const personGroups = useMemo(() => {
    const groups: Record<string, Person[]> = {};
    const allCols = [uncategorizedTag, ...tags];
    allCols.forEach(col => {
      groups[col.id] = [];
    });
    people.forEach(person => {
      const tagId = person.tags?.[0]?.id;
      const columnId = tagId && Object.prototype.hasOwnProperty.call(groups, tagId) ? tagId : 'uncategorized';
      if (groups[columnId]) {
        groups[columnId].push(person);
      }
    });
    for (const groupId in groups) {
      groups[groupId].sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
    }
    return groups;
  }, [people, tags]);

  useImperativeHandle(ref, () => ({
    openSettings: () => setIsSettingsOpen(true),
  }));

  const { mutate: updateKanbanSettings } = useMutation({
    mutationFn: async (settings: Partial<User['people_kanban_settings']>) => {
      if (!user) return;
      const currentSettings = user.people_kanban_settings || {};
      const newSettings = { ...currentSettings, ...settings };
      const { error } = await supabase
        .from('profiles')
        .update({ people_kanban_settings: newSettings })
        .eq('id', user.id);
      if (error) throw error;
      return newSettings;
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(['userProfile', user?.id], (oldUser: User | undefined) => {
        if (oldUser) {
          return { ...oldUser, people_kanban_settings: newSettings };
        }
        return oldUser;
      });
    },
    onError: (error: any) => {
      toast.error("Failed to save view settings.", { description: error.message });
    },
  });

  useEffect(() => {
    const settings = user?.people_kanban_settings;
    const savedOrder = settings?.columnOrder;
    const savedVisible = settings?.visibleColumnIds;
    const savedOverrides = settings?.collapseOverrides || {};

    const allDbTagIds = tags.map(t => t.id);
    
    let initialOrder: string[];
    if (savedOrder && savedOrder.length > 0) {
      initialOrder = [...savedOrder];
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

    const initialVisible = savedVisible !== undefined ? savedVisible : ['uncategorized', ...allDbTagIds];
    setVisibleColumnIds(initialVisible);
    setCollapseOverrides(savedOverrides);

  }, [tags, user]);

  const handleSettingsChange = (newOrder: string[], newVisible: string[]) => {
    setColumnOrder(newOrder);
    setVisibleColumnIds(newVisible);
    updateKanbanSettings({ columnOrder: newOrder, visibleColumnIds: newVisible });
  };

  const toggleColumnCollapse = (columnId: string) => {
    const peopleInColumn = personGroups[columnId] || [];
    const isCurrentlyCollapsed = collapseOverrides[columnId] ?? (peopleInColumn.length === 0);
    const newOverrides = { ...collapseOverrides, [columnId]: !isCurrentlyCollapsed };
    setCollapseOverrides(newOverrides);
    updateKanbanSettings({ collapseOverrides: newOverrides });
  };

  const columns = useMemo(() => {
    const tagMap = new Map([...tags, uncategorizedTag].map(t => [t.id, t]));
    return columnOrder
      .filter(id => visibleColumnIds.includes(id))
      .map(id => tagMap.get(id))
      .filter(Boolean) as Tag[];
  }, [tags, columnOrder, visibleColumnIds, uncategorizedTag]);

  const handleDragStart = (event: DragStartEvent) => {
    dragHappened.current = true;
    const { active } = event;
    setActivePerson(people.find(p => p.id === active.id) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActivePerson(null);
    setTimeout(() => { dragHappened.current = false; }, 0);

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const person = people.find(p => p.id === activeId);
    if (!person) return;

    const sourceContainerId = active.data.current?.sortable.containerId as string;
    const overIsItem = !!over.data.current?.sortable;
    const destContainerId = overIsItem ? over.data.current?.sortable.containerId as string : overId;

    if (!sourceContainerId || !destContainerId) return;

    // Optimistic update
    const previousPeople = queryClient.getQueryData<Person[]>(['people']);
    queryClient.setQueryData<Person[]>(['people'], (oldPeople = []) => {
      const activeIndex = oldPeople.findIndex(p => p.id === activeId);
      if (activeIndex === -1) return oldPeople;

      let newPeople = [...oldPeople];
      const [movedItem] = newPeople.splice(activeIndex, 1);

      if (sourceContainerId === destContainerId) {
        const overIndex = newPeople.findIndex(p => p.id === overId);
        if (overIndex !== -1) {
          newPeople.splice(overIndex, 0, movedItem);
        } else {
          newPeople.push(movedItem);
        }
      } else {
        const destTag = tags.find(t => t.id === destContainerId);
        const otherTags = (movedItem.tags || []).filter(t => t.id !== sourceContainerId);
        movedItem.tags = destTag ? [destTag, ...otherTags] : otherTags;
        
        const overIndex = newPeople.findIndex(p => p.id === overId);
        if (overIndex !== -1) {
          newPeople.splice(overIndex, 0, movedItem);
        } else {
          newPeople.push(movedItem);
        }
      }
      return newPeople;
    });

    // Server update
    try {
      if (sourceContainerId === destContainerId) {
        const columnItems = personGroups[sourceContainerId];
        const oldIndex = columnItems.findIndex(p => p.id === activeId);
        const newIndex = columnItems.findIndex(p => p.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
        const reorderedItems = arrayMove(columnItems, oldIndex, newIndex);
        const { error } = await supabase.rpc('update_person_kanban_order', { p_person_ids: reorderedItems.map(p => p.id) });
        if (error) throw error;
      } else {
        const destTag = tags.find(t => t.id === destContainerId);
        const otherTags = (person.tags || []).filter(t => t.id !== sourceContainerId);
        const finalTags = destTag ? [destTag, ...otherTags] : otherTags;
        
        const { error } = await supabase.rpc('update_person_tags', {
          p_person_id: person.id,
          p_tag_to_remove_id: sourceContainerId === 'uncategorized' ? null : sourceContainerId,
          p_tag_to_add_id: destContainerId === 'uncategorized' ? null : destContainerId,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast.error(`Failed to move person: ${error.message}`);
      queryClient.setQueryData(['people'], previousPeople); // Revert on error
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