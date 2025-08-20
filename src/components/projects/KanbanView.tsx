import React, { useMemo, useRef, useState, useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, DragStartEvent, useDroppable, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Project, PROJECT_STATUS_OPTIONS, ProjectStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { formatInJakarta, cn, generateVibrantGradient } from '@/lib/utils';
import { Badge } from '../ui/badge';
import type { DropAnimation } from '@dnd-kit/core';

const KanbanCard = ({ project, dragHappened }: { project: Project, dragHappened: React.MutableRefObject<boolean> }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const navigate = useNavigate();
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: null, // Menghapus animasi untuk perpindahan instan
  };

  const handleClick = () => {
    if (!dragHappened.current) {
      navigate(`/projects/${project.slug}`);
    }
  };

  const renderDateBadge = () => {
    const { start_date, due_date } = project;

    if (!start_date) {
      return null;
    }

    const startDate = new Date(start_date);
    const dueDate = due_date ? new Date(due_date) : startDate;

    const isSameDay = startDate.getFullYear() === dueDate.getFullYear() &&
                      startDate.getMonth() === dueDate.getMonth() &&
                      startDate.getDate() === dueDate.getDate();

    if (isSameDay) {
      return (
        <Badge variant="outline" className="text-xs font-normal">
          {formatInJakarta(start_date, 'd MMM')}
        </Badge>
      );
    }

    const startMonth = formatInJakarta(start_date, 'MMM');
    const endMonth = formatInJakarta(due_date, 'MMM');

    if (startMonth === endMonth) {
      return (
        <Badge variant="outline" className="text-xs font-normal">
          {`${formatInJakarta(start_date, 'd')}-${formatInJakarta(due_date, 'd')} ${startMonth}`}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-xs font-normal">
        {`${formatInJakarta(start_date, 'd MMM')} - ${formatInJakarta(due_date, 'd MMM')}`}
      </Badge>
    );
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "opacity-30")}>
      <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
        <CardContent className="p-3">
          <div className="space-y-2 block">
            <h4 className="font-semibold text-sm leading-snug">{project.name}</h4>
            
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {project.tags.slice(0, 2).map(tag => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-xs font-normal"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      borderColor: tag.color,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {project.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{project.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-1">
              <div className="flex -space-x-2">
                {project.assignedTo.slice(0, 3).map(user => (
                  <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback style={generateVibrantGradient(user.id)}>{user.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {renderDateBadge()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const KanbanColumn = ({ status, projects, dragHappened, isHovered, isDragging }: { status: { value: string, label: string }, projects: Project[], dragHappened: React.MutableRefObject<boolean>, isHovered: boolean, isDragging: boolean }) => {
  const { setNodeRef } = useDroppable({ id: status.value });
  const projectIds = useMemo(() => projects.map(p => p.id), [projects]);
  const isEmpty = projects.length === 0;
  const [isExpandedByUser, setIsExpandedByUser] = useState(false);

  useEffect(() => {
    if (isHovered) {
      setIsExpandedByUser(true);
    }
    if (!isDragging) {
      setIsExpandedByUser(false);
    }
  }, [isHovered, isDragging]);

  const isExpanded = !isEmpty || isHovered || isExpandedByUser;

  return (
    <div 
      ref={setNodeRef} 
      className={cn("flex-shrink-0 transition-all duration-300", isExpanded ? "w-72" : "w-14")}
      onDoubleClick={() => setIsExpandedByUser(!isExpandedByUser)}
    >
      <div className={cn("h-full flex flex-col", !isExpanded && "items-center")}>
        <h3 className={cn(
          "font-semibold mb-4 px-1 text-base flex items-center",
          !isExpanded && "h-full flex items-center justify-center p-2 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap"
        )}>
          {status.label}
          <Badge variant="secondary" className={cn("ml-2", !isExpanded && "hidden")}>{projects.length}</Badge>
        </h3>
        <div className={cn("bg-muted/50 rounded-lg p-2 min-h-[400px] h-full w-full", !isExpanded && "bg-transparent")}>
          {isExpanded && (
            <SortableContext id={status.value} items={projectIds} strategy={verticalListSortingStrategy}>
              {projects.map(project => (
                <KanbanCard key={project.id} project={project} dragHappened={dragHappened} />
              ))}
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
};

const KanbanView = ({ projects }: { projects: Project[] }) => {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const dragHappened = useRef(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [overContainerId, setOverContainerId] = useState<string | null>(null);

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

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const overId = over.id as string;
      const isColumn = PROJECT_STATUS_OPTIONS.some(opt => opt.value === overId);
      if (isColumn) {
        setOverContainerId(overId);
      } else {
        setOverContainerId(over.data.current?.sortable.containerId || null);
      }
    } else {
      setOverContainerId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveProject(null);
    setOverContainerId(null);
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

  const renderDateBadgeForOverlay = (project: Project) => {
    const { start_date, due_date } = project;
    if (!start_date) return null;
    const startDate = new Date(start_date);
    const dueDate = due_date ? new Date(due_date) : startDate;
    const isSameDay = startDate.getFullYear() === dueDate.getFullYear() && startDate.getMonth() === dueDate.getMonth() && startDate.getDate() === dueDate.getDate();
    if (isSameDay) return <Badge variant="outline" className="text-xs font-normal">{formatInJakarta(start_date, 'd MMM')}</Badge>;
    const startMonth = formatInJakarta(start_date, 'MMM');
    const endMonth = formatInJakarta(due_date, 'MMM');
    if (startMonth === endMonth) return <Badge variant="outline" className="text-xs font-normal">{`${formatInJakarta(start_date, 'd')}-${formatInJakarta(due_date, 'd')} ${startMonth}`}</Badge>;
    return <Badge variant="outline" className="text-xs font-normal">{`${formatInJakarta(start_date, 'd MMM')} - ${formatInJakarta(due_date, 'd MMM')}`}</Badge>;
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={() => setActiveProject(null)}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PROJECT_STATUS_OPTIONS.map(statusOption => (
          <KanbanColumn
            key={statusOption.value}
            status={statusOption}
            projects={projectGroups[statusOption.value as ProjectStatus]}
            dragHappened={dragHappened}
            isHovered={statusOption.value === overContainerId}
            isDragging={!!activeProject}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeProject ? (
          <Card className="shadow-xl">
            <CardContent className="p-3">
              <div className="space-y-2 block">
                <h4 className="font-semibold text-sm leading-snug">{activeProject.name}</h4>
                {activeProject.tags && activeProject.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {activeProject.tags.slice(0, 2).map(tag => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs font-normal"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {activeProject.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        +{activeProject.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <div className="flex -space-x-2">
                    {activeProject.assignedTo.slice(0, 3).map(user => (
                      <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback style={generateVibrantGradient(user.id)}>{user.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {renderDateBadgeForOverlay(activeProject)}
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