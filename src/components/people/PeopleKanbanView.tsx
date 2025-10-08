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
  onDeletePerson: (personId: string) => void;
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
      const isTagColumnVisible = tagId && visibleColumnIds.includes(tagId);
      const columnId = tagId && isTagColumnVisible && Object.prototype.hasOwnProperty.call(groups, tagId) 
        ? tagId 
        : 'uncategorized';
      
      if (groups[columnId]) {
        groups[columnId].push(person);
      }
    });
    for (const groupId in groups) {
      groups[groupId].sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
    }
    return groups;
  }, [people, tags, visibleColumnIds]);

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
    const { active } = event;
    setActivePerson(people.find(p => p.id === active.id) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActivePerson(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    
    const sourceContainerId = active.data.current?.sortable.containerId as string;
    const overIsItem = !!over.data.current?.sortable;
    const destContainerId = overIsItem ? over.data.current?.sortable.containerId as string : overId;

    if (!sourceContainerId || !destContainerId) return;

    const previousPeople = queryClient.getQueryData<Person[]>(['people']) || [];
    
    let newPeopleState: Person[] = JSON.parse(JSON.stringify(previousPeople));
    const activeIndex = newPeopleState.findIndex(p => p.id === activeId);
    if (activeIndex === -1) return;

    const [movedItem] = newPeopleState.splice(activeIndex, 1);

    if (sourceContainerId !== destContainerId) {
      const destTag = tags.find(t => t.id === destContainerId);
      let newTags = (movedItem.tags || []).filter(t => t.id !== sourceContainerId);
      if (destTag && destTag.id !== 'uncategorized') {
        newTags.push(destTag);
      }
      newTags.sort((a, b) => a.name.localeCompare(b.name));
      movedItem.tags = newTags;
    }

    const overIndex = newPeopleState.findIndex(p => p.id === overId);
    if (overIsItem && overIndex !== -1) {
      newPeopleState.splice(overIndex, 0, movedItem);
    } else {
      const itemsInDest = newPeopleState.filter(p => (p.tags?.[0]?.id || 'uncategorized') === destContainerId);
      if (itemsInDest.length > 0) {
        const lastItem = itemsInDest[itemsInDest.length - 1];
        const lastItemIndex = newPeopleState.findIndex(p => p.id === lastItem.id);
        newPeopleState.splice(lastItemIndex + 1, 0, movedItem);
      } else {
        newPeopleState.push(movedItem);
      }
    }

    const finalGroups = newPeopleState.reduce((acc, p) => {
      const tagId = p.tags?.[0]?.id || 'uncategorized';
      if (!acc[tagId]) acc[tagId] = [];
      acc[tagId].push(p);
      return acc;
    }, {} as Record<string, Person[]>);

    for (const tagId in finalGroups) {
      finalGroups[tagId].forEach((p, index) => {
        const originalPerson = newPeopleState.find(op => op.id === p.id);
        if (originalPerson) {
          originalPerson.kanban_order = index;
        }
      });
    }

    queryClient.setQueryData(['people'], newPeopleState);

    try {
      if (sourceContainerId !== destContainerId) {
        const { error: tagError } = await supabase.rpc('update_person_tags', {
          p_person_id: activeId,
          p_tag_to_remove_id: sourceContainerId === 'uncategorized' ? null : sourceContainerId,
          p_tag_to_add_id: destContainerId === 'uncategorized' ? null : destContainerId,
        });
        if (tagError) throw tagError;
      }

      const sourceColumnIds = (finalGroups[sourceContainerId] || []).map(p => p.id);
      const destColumnIds = (finalGroups[destContainerId] || []).map(p => p.id);

      const promises = [];
      if (sourceContainerId !== destContainerId && sourceColumnIds.length > 0) {
        promises.push(supabase.rpc('update_person_kanban_order', { p_person_ids: sourceColumnIds }));
      }
      if (destColumnIds.length > 0) {
        promises.push(supabase.rpc('update_person_kanban_order', { p_person_ids: destColumnIds }));
      }
      
      const results = await Promise.all(promises);
      for (const result of results) {
        if (result.error) throw result.error;
      }
    } catch (error: any) {
      toast.error(`Failed to move person: ${error.message}`);
      queryClient.setQueryData(['people'], previousPeople);
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
            <PeopleKanbanCard person={activePerson} onEdit={() => {}} onDelete={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
});

export default PeopleKanbanView;