import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Person, Tag } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PeopleKanbanColumn from '@/components/people/PeopleKanbanColumn';
import PeopleKanbanCard from '@/components/people/PeopleKanbanCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

const UNTAGGED_COLUMN_ID = 'untagged';

const fetchPeople = async (): Promise<Person[]> => {
  const { data, error } = await supabase.rpc('get_people_with_details');
  if (error) throw new Error(error.message);
  return data as Person[];
};

const fetchTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase.from('tags').select('*').order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const PeopleKanbanBoard = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dragHappened = useRef(false);

  const { data: people = [], isLoading: isLoadingPeople } = useQuery({ queryKey: ['people'], queryFn: fetchPeople });
  const { data: tags = [], isLoading: isLoadingTags } = useQuery({ queryKey: ['tags'], queryFn: fetchTags });

  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [activeColumn, setActiveColumn] = useState<Tag | null>(null);

  useEffect(() => {
    const savedOrder = localStorage.getItem('peopleKanbanOrder');
    if (savedOrder) {
      setColumnOrder(JSON.parse(savedOrder));
    }
  }, []);

  const allColumns = useMemo<Tag[]>(() => [
    ...tags,
    { id: UNTAGGED_COLUMN_ID, name: 'Untagged', color: '#808080' }
  ], [tags]);

  const orderedColumns = useMemo(() => {
    const ordered = columnOrder
      .map(id => allColumns.find(col => col.id === id))
      .filter((c): c is Tag => !!c);
    const remaining = allColumns.filter(c => !columnOrder.includes(c.id));
    return [...ordered, ...remaining];
  }, [allColumns, columnOrder]);

  const peopleByTag = useMemo(() => {
    const grouped: Record<string, Person[]> = {};
    allColumns.forEach(col => grouped[col.id] = []);
    people.forEach(person => {
      if (person.tags && person.tags.length > 0) {
        person.tags.forEach(tag => {
          if (grouped[tag.id]) {
            grouped[tag.id].push(person);
          }
        });
      } else {
        grouped[UNTAGGED_COLUMN_ID].push(person);
      }
    });
    return grouped;
  }, [people, allColumns]);

  const updatePersonTagsMutation = useMutation({
    mutationFn: async ({ personId, tagIdToAdd, tagIdToRemove }: { personId: string, tagIdToAdd: string | null, tagIdToRemove: string | null }) => {
      const { error } = await supabase.rpc('update_person_tags', {
        p_person_id: personId,
        p_tag_to_add_id: tagIdToAdd,
        p_tag_to_remove_id: tagIdToRemove
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
    onError: (error) => {
      toast.error(`Failed to update person: ${error.message}`);
    }
  });

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }));

  const handleDragStart = (event: DragStartEvent) => {
    dragHappened.current = false;
    const { active } = event;
    if (active.data.current?.type === 'Card') {
      setActivePerson(active.data.current.person);
    }
    if (active.data.current?.type === 'Column') {
      setActiveColumn(active.data.current.tag);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePerson(null);
    setActiveColumn(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === 'Column';
    if (isActiveAColumn) {
      const newOrder = arrayMove(orderedColumns, orderedColumns.findIndex(c => c.id === activeId), orderedColumns.findIndex(c => c.id === overId)).map(c => c.id);
      setColumnOrder(newOrder);
      localStorage.setItem('peopleKanbanOrder', JSON.stringify(newOrder));
      return;
    }

    const isActiveACard = active.data.current?.type === 'Card';
    if (isActiveACard) {
      const sourceColumnId = active.data.current?.sortable.containerId;
      const destinationColumnId = over.data.current?.sortable?.containerId || overId;

      if (sourceColumnId !== destinationColumnId) {
        const personId = activeId;
        const tagIdToAdd = destinationColumnId === UNTAGGED_COLUMN_ID ? null : destinationColumnId;
        const tagIdToRemove = sourceColumnId === UNTAGGED_COLUMN_ID ? null : sourceColumnId;
        updatePersonTagsMutation.mutate({ personId, tagIdToAdd, tagIdToRemove });
      }
    }
  };

  const handleEditPerson = (person: Person) => {
    if (!dragHappened.current) {
      navigate(`/people/${person.id}`);
    }
  };

  const handleToggleCollapse = (tagId: string) => {
    setCollapsedColumns(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  if (isLoadingPeople || isLoadingTags) {
    return (
      <div className="flex gap-4 overflow-x-auto p-4 h-[calc(100vh-150px)]">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-72 h-full flex-shrink-0" />)}
      </div>
    );
  }

  return (
    <div className="p-4">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-150px)]">
          <SortableContext items={orderedColumns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            {orderedColumns.map(tag => (
              <PeopleKanbanColumn
                key={tag.id}
                tag={tag}
                people={peopleByTag[tag.id] || []}
                dragHappened={dragHappened}
                onEditPerson={handleEditPerson}
                onDeletePerson={() => {}}
                isCollapsed={collapsedColumns.includes(tag.id)}
                onToggleCollapse={handleToggleCollapse}
              />
            ))}
          </SortableContext>
        </div>
        <DragOverlay>
          {activeColumn && <PeopleKanbanColumn tag={activeColumn} people={peopleByTag[activeColumn.id] || []} dragHappened={dragHappened} onEditPerson={() => {}} onDeletePerson={() => {}} isCollapsed={false} onToggleCollapse={() => {}} />}
          {activePerson && <PeopleKanbanCard person={activePerson} onEdit={() => {}} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default PeopleKanbanBoard;