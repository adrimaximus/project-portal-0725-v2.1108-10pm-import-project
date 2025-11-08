import React, { useMemo, useState, useEffect, useRef } from 'react';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Project, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, ProjectStatus, PaymentStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatInJakarta, cn, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { CheckCircle } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import { useProjectKanbanMutations } from '@/hooks/useProjectKanbanMutations';
import { isSameDay, subDays } from 'date-fns';

const KanbanView = ({ projects, groupBy }: { projects: Project[], groupBy: 'status' | 'payment_status' }) => {
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const dragHappened = useRef(false);
  const { updateProjectOrder } = useProjectKanbanMutations();
  const [projectGroups, setProjectGroups] = useState<Record<string, Project[]>>({});
  const isOptimisticUpdate = useRef(false);

  const columns = useMemo(() => {
    return groupBy === 'status' ? PROJECT_STATUS_OPTIONS : PAYMENT_STATUS_OPTIONS;
  }, [groupBy]);

  useEffect(() => {
    if (isOptimisticUpdate.current) {
      isOptimisticUpdate.current = false;
      return;
    }

    if (!activeProject) {
      const groups: Record<string, Project[]> = {};
      columns.forEach(opt => {
        groups[opt.value] = [];
      });
      
      projects.forEach(project => {
        const key = project[groupBy];
        if (key && Object.prototype.hasOwnProperty.call(groups, key)) {
          groups[key].push(project);
        } else {
          if (columns.length > 0) {
            groups[columns[0].value].push(project);
          }
        }
      });
  
      for (const groupKey in groups) {
          const orderKey = groupBy === 'status' ? 'kanban_order' : 'payment_kanban_order';
          groups[groupKey].sort((a, b) => {
              const orderA = a[orderKey] ?? 0;
              const orderB = b[orderKey] ?? 0;
              return orderA - orderB;
          });
      }
      setProjectGroups(groups);
    }
  }, [projects, columns, groupBy, activeProject]);

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

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveProject(projects.find(p => p.id === event.active.id) || null);
    dragHappened.current = true;
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

    if (!activeContainer || !overContainer) return;

    setProjectGroups(prev => {
      const newGroups = { ...prev };
      const sourceItems = newGroups[activeContainer];
      const destItems = newGroups[overContainer];
      if (!sourceItems || !destItems) return prev;

      const activeIndex = sourceItems.findIndex(p => p.id === activeId);
      if (activeIndex === -1) return prev;

      const [movedItem] = sourceItems.splice(activeIndex, 1);

      if (activeContainer === overContainer) {
        const overIndex = destItems.findIndex(p => p.id === overId);
        if (overIndex !== -1) {
          destItems.splice(overIndex, 0, movedItem);
        }
      } else {
        if (groupBy === 'status') {
          movedItem.status = overContainer as ProjectStatus;
        } else {
          movedItem.payment_status = overContainer as PaymentStatus;
        }
        const overIndex = overIsItem ? destItems.findIndex(p => p.id === overId) : destItems.length;
        if (overIndex !== -1) {
          destItems.splice(overIndex, 0, movedItem);
        } else {
          destItems.push(movedItem);
        }
      }
      return newGroups;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveProject(null);
    setTimeout(() => { dragHappened.current = false; }, 0);

    if (!over) return;

    const activeId = String(active.id);
    const activeContainer = active.data.current?.sortable.containerId as string;
    const overIsItem = !!over.data.current?.sortable;
    const overContainer = overIsItem ? over.data.current?.sortable.containerId as string : String(over.id);
    
    isOptimisticUpdate.current = true;

    const activeProjectInstance = projects.find(p => p.id === activeId);
    if (!activeProjectInstance || !activeContainer || !overContainer) return;

    const newProjectsState = Object.values(projectGroups).flat();

    const finalUpdates: any[] = [];
    for (const groupKey in projectGroups) {
        projectGroups[groupKey].forEach((project, index) => {
            finalUpdates.push({
                project_id: project.id,
                kanban_order: index,
                [groupBy]: groupKey,
            });
        });
    }

    if (finalUpdates.length > 0) {
        const newStatusLabel = columns.find(opt => opt.value === overContainer)?.label || overContainer;
        updateProjectOrder({
            newProjects: newProjectsState,
            finalUpdates,
            groupBy,
            activeProjectName: activeProjectInstance.name,
            newStatusLabel,
            movedColumns: activeContainer !== overContainer,
        });
    }
  };

  const renderDateBadgeForOverlay = (project: Project) => {
    const { start_date, due_date } = project;
    if (!start_date) return null;
    const startDate = new Date(start_date);
    let dueDate = due_date ? new Date(due_date) : startDate;

    const isExclusiveEndDate = 
      due_date &&
      dueDate.getUTCHours() === 0 &&
      dueDate.getUTCMinutes() === 0 &&
      dueDate.getUTCSeconds() === 0 &&
      dueDate.getUTCMilliseconds() === 0 &&
      !isSameDay(startDate, dueDate);

    const adjustedDueDate = isExclusiveEndDate ? subDays(dueDate, 1) : dueDate;

    if (isSameDay(startDate, adjustedDueDate)) return <Badge variant="outline" className="text-xs font-normal">{formatInJakarta(start_date, 'd MMM')}</Badge>;
    const startMonth = formatInJakarta(start_date, 'MMM');
    const endMonth = formatInJakarta(adjustedDueDate, 'MMM');
    if (startMonth === endMonth) return <Badge variant="outline" className="text-xs font-normal">{`${formatInJakarta(start_date, 'd')}-${formatInJakarta(adjustedDueDate, 'd')} ${startMonth}`}</Badge>;
    return <Badge variant="outline" className="text-xs font-normal">{`${formatInJakarta(start_date, 'd MMM')} - ${formatInJakarta(adjustedDueDate, 'd MMM')}`}</Badge>;
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={() => setActiveProject(null)}>
      <div className="flex flex-row gap-4 overflow-x-auto pb-4 h-full">
        {columns.map(statusOption => {
          const projectsInColumn = projectGroups[statusOption.value] || [];
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
                        <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                        <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
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