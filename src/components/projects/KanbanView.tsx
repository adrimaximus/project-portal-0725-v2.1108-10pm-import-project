import React, { useMemo, useRef, useState, useEffect } from 'react';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Project, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { formatInJakarta, generateVibrantGradient } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { CheckCircle } from 'lucide-react';
import KanbanColumn from './KanbanColumn';

const KanbanView = ({ projects, groupBy }: { projects: Project[], groupBy: 'status' | 'payment_status' }) => {
  const queryClient = useQueryClient();
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 8,
      },
    })
  );
  const dragHappened = useRef(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);

  useEffect(() => {
    const savedState = localStorage.getItem('projectKanbanCollapsedColumns');
    if (savedState) {
      setCollapsedColumns(JSON.parse(savedState));
    }
  }, []);

  const toggleColumnCollapse = (columnId: string) => {
    const newCollapsedColumns = collapsedColumns.includes(columnId)
      ? collapsedColumns.filter(id => id !== columnId)
      : [...collapsedColumns, columnId];
    setCollapsedColumns(newCollapsedColumns);
    localStorage.setItem('projectKanbanCollapsedColumns', JSON.stringify(newCollapsedColumns));
  };

  const columns = useMemo(() => {
    return groupBy === 'status' ? PROJECT_STATUS_OPTIONS : PAYMENT_STATUS_OPTIONS;
  }, [groupBy]);

  const projectGroups = useMemo(() => {
    const groups: Record<string, Project[]> = {};
    columns.forEach(opt => {
      groups[opt.value] = [];
    });
    projects.forEach(project => {
      const key = project[groupBy];
      if (key && groups[key]) {
        groups[key].push(project);
      }
    });
    for (const groupKey in groups) {
        groups[groupKey].sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
    }
    return groups;
  }, [projects, columns, groupBy]);

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
    
    const activeContainer = active.data.current?.sortable.containerId as string;
    const overContainer = over.data.current?.sortable.containerId as string || over.id as string;

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
            if (p[groupBy] === activeContainer) {
                const reorderedIndex = reorderedItems.findIndex(item => item.id === p.id);
                return { ...p, kanban_order: reorderedIndex };
            }
            return p;
        });
        queryClient.setQueryData(['projects'], newProjects);

        const updates = reorderedItems.map((project, index) => ({
            project_id: project.id,
            kanban_order: index,
            [groupBy]: activeContainer,
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
      const newGroupValue = overContainer;
      
      const sourceItems = [...projectGroups[activeContainer]];
      const destinationItems = [...projectGroups[overContainer]];
      
      const [movedItem] = sourceItems.splice(sourceItems.findIndex(p => p.id === activeId), 1);
      
      const overIndex = destinationItems.findIndex(p => p.id === overId);
      const newIndex = overIndex >= 0 ? overIndex : destinationItems.length;
      
      destinationItems.splice(newIndex, 0, { ...movedItem, [groupBy]: newGroupValue });

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
          [groupBy]: activeContainer,
      }));
      const destinationUpdates = destinationItems.map((project, index) => ({
          project_id: project.id,
          kanban_order: index,
          [groupBy]: newGroupValue,
      }));

      const allUpdates = [...sourceUpdates, ...destinationUpdates];

      const { error } = await supabase.rpc('update_project_kanban_order', { updates: allUpdates });

      if (error) {
          toast.error(`Failed to move project: ${error.message}`);
          queryClient.setQueryData(['projects'], originalProjects);
      } else {
          const newStatusLabel = columns.find(opt => opt.value === newGroupValue)?.label || newGroupValue;
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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveProject(null)}>
      <div className="flex flex-row gap-4 overflow-x-auto pb-4 h-full">
        {columns.map(statusOption => {
          const projectsInColumn = projectGroups[statusOption.value];
          const isColumnCollapsed = collapsedColumns.includes(statusOption.value);
          return (
            <KanbanColumn
              key={statusOption.value}
              status={statusOption}
              projects={projectsInColumn}
              dragHappened={dragHappened}
              isCollapsed={isColumnCollapsed}
              onToggleCollapse={toggleColumnCollapse}
            />
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeProject ? (
          <Card className="shadow-xl w-72">
            <CardContent className="p-3">
              <div className="space-y-2 block">
                <h4 className="font-semibold text-sm leading-snug flex items-center gap-1.5">
                  {activeProject.status === 'Completed' && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                  {activeProject.name}
                </h4>
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