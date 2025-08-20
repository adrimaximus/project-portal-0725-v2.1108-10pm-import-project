import React, { useMemo, useRef, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Project, PROJECT_STATUS_OPTIONS, ProjectStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { formatInJakarta, cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

const KanbanCard = ({ project, dragHappened }: { project: Project, dragHappened: React.MutableRefObject<boolean> }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const navigate = useNavigate();
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 0.25s ease-in-out',
  };

  const handleClick = () => {
    if (!dragHappened.current) {
      navigate(`/projects/${project.slug}`);
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "opacity-30")}>
      <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
        <CardContent className="p-3">
          <div className="space-y-2 block">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const KanbanColumn = ({ status, projects, dragHappened }: { status: { value: string, label: string }, projects: Project[], dragHappened: React.MutableRefObject<boolean> }) => {
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
            <KanbanCard key={project.id} project={project} dragHappened={dragHappened} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

const KanbanView = ({ projects }: { projects: Project[] }) => {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const dragHappened = useRef(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

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
    for (const status in groups) {
        groups[status as ProjectStatus].sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
    }
    return groups;
  }, [projects]);

  const handleDragStart = (event: DragStartEvent) => {
    dragHappened.current = true;
    const { active } = event;
    setActiveProject(projects.find(p => p.id === active.id) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveProject(null);
    setTimeout(() => {
      dragHappened.current = false;
    }, 0);

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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveProject(null)}>
      <SortableContext items={allProjectIds}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PROJECT_STATUS_OPTIONS.map(statusOption => (
            <KanbanColumn
              key={statusOption.value}
              status={statusOption}
              projects={projectGroups[statusOption.value as ProjectStatus]}
              dragHappened={dragHappened}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeProject ? (
          <Card className="shadow-xl">
            <CardContent className="p-3">
              <div className="space-y-2 block">
                <h4 className="font-semibold text-sm leading-snug">{activeProject.name}</h4>
                <p className="text-xs text-muted-foreground">{activeProject.category}</p>
                <div className="flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {activeProject.assignedTo.slice(0, 3).map(user => (
                      <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {activeProject.due_date && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {formatInJakarta(activeProject.due_date, 'd MMM')}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanView;