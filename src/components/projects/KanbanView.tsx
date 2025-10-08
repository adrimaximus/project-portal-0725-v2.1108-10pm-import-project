import { Project, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatInJakarta, generatePastelColor, getAvatarUrl, getStatusStyles, getPaymentStatusStyles } from '@/lib/utils';
import { Badge } from '../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  Paperclip,
  ListChecks,
  Calendar,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import KanbanCard from './KanbanCard';

interface KanbanViewProps {
  projects: Project[];
  groupBy: 'status' | 'payment_status';
}

const KanbanColumn = ({ title, projects, color }: { title: string, projects: Project[], color: string }) => {
  const {
    setNodeRef,
  } = useSortable({ id: title, data: { type: 'column' } });

  return (
    <div ref={setNodeRef} className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
      <div className="bg-muted rounded-lg h-full">
        <div className={`p-4 border-b-2`} style={{ borderBottomColor: color }}>
          <h3 className="font-semibold flex items-center">
            <span className="mr-2 w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
            {title}
            <span className="ml-2 text-sm font-normal text-muted-foreground">{projects.length}</span>
          </h3>
        </div>
        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-280px)]">
            {projects.map(project => (
              <KanbanCard key={project.id} project={project} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

const KanbanView = ({ projects, groupBy }: KanbanViewProps) => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const queryClient = useQueryClient();

  const statusOptions = groupBy === 'status' 
    ? PROJECT_STATUS_OPTIONS.map(s => ({ ...s, color: getStatusStyles(s.value).hex }))
    : PAYMENT_STATUS_OPTIONS.map(s => ({ ...s, color: getPaymentStatusStyles(s.value).hex }));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateProjectOrderMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase.rpc('update_project_kanban_order', { updates, group_by_key: groupBy });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project order updated');
    },
    onError: (error) => {
      toast.error('Failed to update project order: ' + error.message);
    }
  });

  const handleDragStart = (event: any) => {
    const { active } = event;
    const project = projects.find(p => p.id === active.id);
    if (project) {
      setActiveProject(project);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveProject(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeProject = projects.find(p => p.id === activeId);
    if (!activeProject) return;

    let newStatus = activeProject[groupBy];
    let newProjectsOrder: Project[] = [...projects];

    const overIsColumn = statusOptions.some(s => s.value === overId);

    if (overIsColumn) {
      newStatus = overId;
      const projectsInNewColumn = projects.filter(p => p[groupBy] === newStatus);
      const newIndex = projectsInNewColumn.length;
      
      const oldIndex = projects.findIndex(p => p.id === activeId);
      newProjectsOrder.splice(oldIndex, 1);
      
      const insertionIndex = projects.filter(p => p[groupBy] === newStatus).length + projects.filter(p => p[groupBy] !== newStatus).findIndex(p => p[groupBy] === newStatus);
      newProjectsOrder.splice(insertionIndex, 0, { ...activeProject, [groupBy]: newStatus });

    } else {
      const overProject = projects.find(p => p.id === overId);
      if (!overProject) return;
      newStatus = overProject[groupBy];

      const oldIndex = projects.findIndex(p => p.id === activeId);
      const newIndex = projects.findIndex(p => p.id === overId);

      const [movedProject] = newProjectsOrder.splice(oldIndex, 1);
      newProjectsOrder.splice(newIndex, 0, { ...movedProject, [groupBy]: newStatus });
    }

    const updates = statusOptions.flatMap(status => {
      return newProjectsOrder
        .filter(p => p[groupBy] === status.value)
        .map((p, index) => ({
          project_id: p.id,
          kanban_order: index,
          [groupBy]: status.value
        }));
    });

    updateProjectOrderMutation.mutate(updates);
  };

  const groupedProjects = statusOptions.reduce((acc, status) => {
    acc[status.value] = projects
      .filter(p => p[groupBy] === status.value)
      .sort((a, b) => (groupBy === 'status' ? (a.kanban_order || 0) : (a.payment_kanban_order || 0)) - (groupBy === 'status' ? (b.kanban_order || 0) : (b.payment_kanban_order || 0)));
    return acc;
  }, {} as { [key: string]: Project[] });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        <SortableContext items={statusOptions.map(s => s.value)} >
          {statusOptions.map(status => (
            <KanbanColumn
              key={status.value}
              title={status.label}
              projects={groupedProjects[status.value] || []}
              color={status.color}
            />
          ))}
        </SortableContext>
      </div>
      <DragOverlay>
        {activeProject ? <KanbanCard project={activeProject} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanView;