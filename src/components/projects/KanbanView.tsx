import React, { useMemo } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Project, PROJECT_STATUS_OPTIONS, ProjectStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { formatInJakarta } from '@/lib/utils';
import { Badge } from '../ui/badge';

const KanbanCard = ({ project }: { project: Project }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <Link to={`/projects/${project.slug}`} className="space-y-2 block">
            <h4 className="font-semibold text-sm leading-snug">{project.name}</h4>
            <p className="text-xs text-muted-foreground">{project.category}</p>
            <div className="flex justify-between items-center">
              <div className="flex -space-x-2">
                {project.assignedTo.slice(0, 3).map(user => (
                  <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {project.due_date && (
                <Badge variant="outline" className="text-xs font-normal">
                  {formatInJakarta(project.due_date, 'd MMM')}
                </Badge>
              )}
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

const KanbanColumn = ({ status, projects }: { status: { value: string, label: string }, projects: Project[] }) => {
  const projectIds = useMemo(() => projects.map(p => p.id), [projects]);

  return (
    <div className="w-72 flex-shrink-0">
      <h3 className="font-semibold mb-4 px-1 text-base flex items-center">
        {status.label}
        <Badge variant="secondary" className="ml-2">{projects.length}</Badge>
      </h3>
      <div className="bg-muted/50 rounded-lg p-2 min-h-[400px] h-full">
        <SortableContext id={status.value} items={projectIds} strategy={verticalListSortingStrategy}>
          {projects.map(project => (
            <KanbanCard key={project.id} project={project} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

const KanbanView = ({ projects }: { projects: Project[] }) => {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const projectGroups = useMemo(() => {
    const groups: Record<ProjectStatus, Project[]> = {} as any;
    PROJECT_STATUS_OPTIONS.forEach(opt => {
      groups[opt.value as ProjectStatus] = [];
    });
    projects.forEach(project => {
      if (project.status && groups[project.status]) {
        groups[project.status].push(project);
      }
    });
    // Make sure each group is sorted by kanban_order
    for (const status in groups) {
        groups[status as ProjectStatus].sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
    }
    return groups;
  }, [projects]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    
    const activeContainer = active.data.current?.sortable.containerId as ProjectStatus;
    const overContainer = over.data.current?.sortable.containerId as ProjectStatus || over.id as ProjectStatus;

    const activeProject = projects.find(p => p.id === activeId);
    if (!activeProject) return;

    const originalProjects = [...projects];

    if (activeContainer === overContainer) {
      // Reordering within the same column
      const items = projectGroups[activeContainer];
      const oldIndex = items.findIndex(p => p.id === activeId);
      const newIndex = items.findIndex(p => p.id === overId);

      if (oldIndex !== newIndex) {
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        
        const newProjects = originalProjects.map(p => {
            if (p.status === activeContainer) {
                const reorderedIndex = reorderedItems.findIndex(item => item.id === p.id);
                return { ...p, kanban_order: reorderedIndex };
            }
            return p;
        });
        queryClient.setQueryData(['projects'], newProjects);

        const updates = reorderedItems.map((project, index) => ({
            project_id: project.id,
            kanban_order: index,
            status: activeContainer,
        }));

        const { error } = await supabase.rpc('update_project_kanban_order', { updates });

        if (error) {
            toast.error(`Failed to reorder projects: ${error.message}`);
            queryClient.setQueryData(['projects'], originalProjects);
        } else {
            toast.success(`Project order updated.`);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      }
    } else {
      // Moving to a different column
      const newStatus = overContainer;
      
      const sourceItems = [...projectGroups[activeContainer]];
      const destinationItems = [...projectGroups[overContainer]];
      
      const [movedItem] = sourceItems.splice(sourceItems.findIndex(p => p.id === activeId), 1);
      
      const overIndex = destinationItems.findIndex(p => p.id === overId);
      const newIndex = overIndex >= 0 ? overIndex : destinationItems.length;
      
      destinationItems.splice(newIndex, 0, { ...movedItem, status: newStatus });

      const updatedProjectGroups = {
          ...projectGroups,
          [activeContainer]: sourceItems,
          [overContainer]: destinationItems,
      };
      const optimisticallyUpdatedProjects = Object.values(updatedProjectGroups).flat();
      queryClient.setQueryData(['projects'], optimisticallyUpdatedProjects);

      const sourceUpdates = sourceItems.map((project, index) => ({
          project_id: project.id,
          kanban_order: index,
          status: activeContainer,
      }));
      const destinationUpdates = destinationItems.map((project, index) => ({
          project_id: project.id,
          kanban_order: index,
          status: newStatus,
      }));

      const allUpdates = [...sourceUpdates, ...destinationUpdates];

      const { error } = await supabase.rpc('update_project_kanban_order', { updates: allUpdates });

      if (error) {
          toast.error(`Failed to move project: ${error.message}`);
          queryClient.setQueryData(['projects'], originalProjects);
      } else {
          const newStatusLabel = PROJECT_STATUS_OPTIONS.find(opt => opt.value === newStatus)?.label || newStatus;
          toast.success(`Project "${activeProject.name}" moved to ${newStatusLabel}.`);
          queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    }
  };

  const allProjectIds = useMemo(() => projects.map(p => p.id), [projects]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={allProjectIds}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PROJECT_STATUS_OPTIONS.map(statusOption => (
            <KanbanColumn
              key={statusOption.value}
              status={statusOption}
              projects={projectGroups[statusOption.value as ProjectStatus]}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default KanbanView;