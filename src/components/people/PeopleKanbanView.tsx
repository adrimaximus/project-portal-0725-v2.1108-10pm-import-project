import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, DragStartEvent, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { Person, Tag, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import PeopleKanbanColumn from './PeopleKanbanColumn';
import PeopleKanbanCard from './PeopleKanbanCard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '../ui/button';
import { Settings2 } from 'lucide-react';
import KanbanSettingsDialog from './KanbanSettingsDialog';

interface PeopleKanbanViewProps {
  people: Person[];
  tags: Tag[];
}

const PeopleKanbanView = ({ people, tags }: PeopleKanbanViewProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const kanbanSettings = useMemo(() => {
    const defaultSettings = {
      groupBy: 'tags',
      visibleColumns: tags.map(t => t.id),
    };
    if (user?.people_kanban_settings) {
      return { ...defaultSettings, ...user.people_kanban_settings };
    }
    return defaultSettings;
  }, [user, tags]);

  const { mutate: updateKanbanSettings } = useMutation({
    mutationFn: async (settings: Partial<User['people_kanban_settings']>) => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .update({ people_kanban_settings: { ...kanbanSettings, ...settings } })
        .eq('id', user.id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
      toast.success('Kanban settings updated.');
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const uncategorizedTag: Tag = { id: 'uncategorized', name: 'Uncategorized', color: '#9ca3af' };
  const allGroups = useMemo(() => [uncategorizedTag, ...tags], [tags]);
  const visibleGroups = useMemo(() => allGroups.filter(g => kanbanSettings.visibleColumns.includes(g.id)), [allGroups, kanbanSettings.visibleColumns]);

  const groups = useMemo(() => {
    const grouped: { [key: string]: Person[] } = {};
    visibleGroups.forEach(group => {
      grouped[group.id] = [];
    });

    people.forEach(person => {
      const personTags = person.tags?.map(t => t.id) || [];
      let assigned = false;
      visibleGroups.forEach(group => {
        if (personTags.includes(group.id)) {
          grouped[group.id].push(person);
          assigned = true;
        }
      });
      if (!assigned && grouped['uncategorized']) {
        grouped['uncategorized'].push(person);
      }
    });

    for (const groupId in grouped) {
      grouped[groupId].sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
    }
    return grouped;
  }, [people, visibleGroups]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(MouseSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const person = people.find(p => p.id === active.id);
    if (person) setActivePerson(person);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActivePerson(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activePerson = people.find(p => p.id === activeId);
    if (!activePerson) return;

    const oldTagId = activePerson.tags?.[0]?.id || 'uncategorized';
    const newTagId = over.data.current?.sortable?.containerId || overId;

    if (oldTagId !== newTagId) {
      // Update tag
      const { error } = await supabase.rpc('update_person_tags', {
        p_person_id: activeId,
        p_tag_to_remove_id: oldTagId === 'uncategorized' ? null : oldTagId,
        p_tag_to_add_id: newTagId === 'uncategorized' ? null : newTagId,
      });

      if (error) {
        toast.error(`Failed to move person: ${error.message}`);
      } else {
        toast.success(`Moved to ${tags.find(t => t.id === newTagId)?.name || 'Uncategorized'}`);
        queryClient.invalidateQueries({ queryKey: ['people'] });
      }
    } else {
      // Reorder within the same column
      const items = groups[newTagId];
      const oldIndex = items.findIndex(p => p.id === activeId);
      const newIndex = items.findIndex(p => p.id === overId);

      if (oldIndex !== newIndex) {
        const newOrder = Array.from(items.map(p => p.id));
        const [movedItem] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, movedItem);

        const { error } = await supabase.rpc('update_person_kanban_order', { p_person_ids: newOrder });
        if (error) {
          toast.error(`Failed to reorder: ${error.message}`);
        } else {
          queryClient.invalidateQueries({ queryKey: ['people'] });
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-2">
        <Button variant="ghost" onClick={() => setIsSettingsOpen(true)}>
          <Settings2 className="mr-2 h-4 w-4" />
          Customize View
        </Button>
      </div>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full">
            <SortableContext items={visibleGroups.map(g => g.id)} strategy={horizontalListSortingStrategy}>
              {visibleGroups.map(group => (
                <PeopleKanbanColumn key={group.id} id={group.id} title={group.name} people={groups[group.id] || []} />
              ))}
            </SortableContext>
          </div>
        </div>
        <DragOverlay>
          {activePerson ? <PeopleKanbanCard person={activePerson} /> : null}
        </DragOverlay>
      </DndContext>
      <KanbanSettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        allColumns={allGroups}
        visibleColumns={kanbanSettings.visibleColumns}
        onSave={(newVisibleColumns) => {
          updateKanbanSettings({ visibleColumns: newVisibleColumns });
        }}
      />
    </div>
  );
};

export default PeopleKanbanView;