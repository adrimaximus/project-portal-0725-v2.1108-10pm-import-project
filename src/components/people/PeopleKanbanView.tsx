import React, { useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, DragOverEvent, DropAnimation, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { Person, Tag, User, Company } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import PeopleKanbanColumn from './PeopleKanbanColumn';
import PeopleKanbanCard from './PeopleKanbanCard';
import KanbanColumnEditor from './KanbanColumnEditor';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useAuth } from '@/contexts/AuthContext';
import { usePeopleKanbanMutations } from '@/hooks/usePeopleKanbanMutations';

type PeopleKanbanViewProps = {
  people: Person[];
  tags: Tag[];
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  kanbanGroupBy: 'tags' | 'company';
};

type KanbanViewHandle = {
  openSettings: () => void;
};

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const PeopleKanbanView = forwardRef<KanbanViewHandle, PeopleKanbanViewProps>(({ people, tags, onEditPerson, onDeletePerson, kanbanGroupBy }, ref) => {
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
  const { updatePeopleOrder } = usePeopleKanbanMutations();
  const [personGroups, setPersonGroups] = useState<Record<string, Person[]>>({});
  const [isDragging, setIsDragging] = useState(false);

  const uncategorizedTag: Tag = { id: 'uncategorized', name: 'Uncategorized', color: '#9ca3af', user_id: '' };

  const { data: allCompanies = [] } = useQuery<Company[]>({
    queryKey: ['allCompaniesForKanban'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('*');
      if (error) throw error;
      return data;
    },
    enabled: kanbanGroupBy === 'company',
  });

  const columns = useMemo(() => {
    if (kanbanGroupBy === 'company') {
      const companyMap = new Map<string, { id: string, name: string, color: string }>();
      people.forEach(p => {
        if (p.company) {
          if (!companyMap.has(p.company)) {
            const companyRecord = allCompanies.find(c => c.name === p.company);
            companyMap.set(p.company, {
              id: companyRecord?.id || p.company, // Fallback to name if no ID
              name: p.company,
              color: '#6b7280'
            });
          }
        }
      });
      const companyColumns = Array.from(companyMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      return [uncategorizedTag, ...companyColumns];
    }
    // Default to tags
    const tagMap = new Map([...tags, uncategorizedTag].map(t => [t.id, t]));
    return columnOrder
      .filter(id => visibleColumnIds.includes(id))
      .map(id => tagMap.get(id))
      .filter(Boolean) as (Tag | { id: string, name: string, color: string })[];
  }, [kanbanGroupBy, people, tags, columnOrder, visibleColumnIds, uncategorizedTag, allCompanies]);

  useEffect(() => {
    if (!isDragging) {
      const groups: Record<string, Person[]> = {};
      columns.forEach(col => {
        groups[col.id] = [];
      });
      people.forEach(person => {
        let columnId = 'uncategorized';
        if (kanbanGroupBy === 'tags') {
          const tagId = person.tags?.[0]?.id;
          if (tagId && visibleColumnIds.includes(tagId) && Object.prototype.hasOwnProperty.call(groups, tagId)) {
            columnId = tagId;
          }
        } else { // kanbanGroupBy === 'company'
          const companyName = person.company;
          const companyColumn = columns.find(c => c.name === companyName);
          if (companyColumn) {
            columnId = companyColumn.id;
          }
        }
        if (groups[columnId]) {
          groups[columnId].push(person);
        }
      });
      for (const groupId in groups) {
        groups[groupId].sort((a, b) => (a.kanban_order ?? 0) - (b.kanban_order ?? 0));
      }
      setPersonGroups(groups);
    }
  }, [people, tags, visibleColumnIds, isDragging, kanbanGroupBy, columns]);

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

  const handleDragStart = (event: DragStartEvent) => {
    dragHappened.current = true;
    setIsDragging(true);
    const { active } = event;
    setActivePerson(people.find(p => p.id === active.id) || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeContainer = active.data.current?.sortable.containerId as string;
    const overIsItem = !!over.data.current?.sortable;
    const overContainer = overIsItem ? over.data.current?.sortable.containerId as string : overId;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setPersonGroups(prev => {
      const newGroups = { ...prev };
      const sourceItems = newGroups[activeContainer];
      const destItems = newGroups[overContainer];
      if (!sourceItems || !destItems) return prev;

      const activeIndex = sourceItems.findIndex(p => p.id === activeId);
      if (activeIndex === -1) return prev;

      const [movedItem] = sourceItems.splice(activeIndex, 1);

      const overIndex = overIsItem ? destItems.findIndex(p => p.id === overId) : destItems.length;
      if (overIndex !== -1) {
        destItems.splice(overIndex, 0, movedItem);
      } else {
        destItems.push(movedItem);
      }
      
      return newGroups;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActivePerson(null);
      setIsDragging(false);
      setTimeout(() => { dragHappened.current = false; }, 0);
      return;
    }

    const activeId = String(active.id);
    const sourceContainerId = active.data.current?.sortable.containerId as string;
    const overIsItem = !!over.data.current?.sortable;
    const destContainerId = overIsItem ? over.data.current?.sortable.containerId as string : String(over.id);

    if (!sourceContainerId || !destContainerId) {
      setActivePerson(null);
      setIsDragging(false);
      setTimeout(() => { dragHappened.current = false; }, 0);
      return;
    }

    setPersonGroups(currentGroups => {
      let finalGroups = { ...currentGroups };
      if (sourceContainerId === destContainerId) {
        const items = finalGroups[sourceContainerId];
        const oldIndex = items.findIndex(p => p.id === activeId);
        const newIndex = items.findIndex(p => p.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          finalGroups[sourceContainerId] = arrayMove(items, oldIndex, newIndex);
        }
      }
      return finalGroups;
    });
    setActivePerson(null);
    setIsDragging(false);
    setTimeout(() => { dragHappened.current = false; }, 0);

    const newPeopleState = Object.values(personGroups).flat();
    const sourceColumnIds = (personGroups[sourceContainerId] || []).map(p => p.id);
    const destColumnIds = (personGroups[destContainerId] || []).map(p => p.id);

    updatePeopleOrder({
      newPeopleState,
      activeId,
      sourceContainerId,
      destContainerId,
      sourceColumnIds,
      destColumnIds,
      groupBy: kanbanGroupBy,
      allCompanies,
      columns,
    });
  };

  const handleDragCancel = () => {
    setActivePerson(null);
    setIsDragging(false);
    setTimeout(() => { dragHappened.current = false; }, 0);
  };

  const allTagsForEditor = [uncategorizedTag, ...tags];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className="flex flex-row items-start gap-4 overflow-x-auto pb-4">
        {kanbanGroupBy === 'tags' && (
          <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isSettingsOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
            <div className="w-64 bg-muted/50 rounded-lg border">
              <KanbanColumnEditor
                allTags={allTagsForEditor}
                columnOrder={columnOrder}
                visibleColumnIds={visibleColumnIds}
                onSettingsChange={handleSettingsChange}
                onClose={() => setIsSettingsOpen(false)}
              />
            </div>
          </div>
        )}

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
      <DragOverlay dropAnimation={dropAnimation}>
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