import React, { useMemo, useState, useEffect, useRef } from 'react';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverEvent, DropAnimation, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Project, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, ProjectStatus, PaymentStatus } from '@/types';
import { useProjectKanbanMutations } from '@/hooks/useProjectKanbanMutations';
import KanbanCard from './KanbanCard';
import KanbanColumn from './KanbanColumn';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import { usePaymentStatuses } from '@/hooks/usePaymentStatuses';

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const KanbanView = ({ projects, groupBy }: { projects: Project[], groupBy: 'status' | 'payment_status' }) => {
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const dragHappened = useRef(false);
  const { updateProjectOrder } = useProjectKanbanMutations();
  const [projectGroups, setProjectGroups] = useState<Record<string, Project[]>>({});
  
  const { data: dynamicProjectStatuses = [] } = useProjectStatuses();
  const { data: dynamicPaymentStatuses = [] } = usePaymentStatuses();

  const columns = useMemo(() => {
    if (groupBy === 'status') {
      if (dynamicProjectStatuses.length > 0) {
        return dynamicProjectStatuses.map(s => ({ value: s.name, label: s.name }));
      }
      return PROJECT_STATUS_OPTIONS;
    }
    
    if (dynamicPaymentStatuses.length > 0) {
        return dynamicPaymentStatuses.map(s => ({ value: s.name, label: s.name }));
    }
    return PAYMENT_STATUS_OPTIONS;
  }, [groupBy, dynamicProjectStatuses, dynamicPaymentStatuses]);

  useEffect(() => {
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
             const firstCol = columns[0].value;
             if (!groups[firstCol]) groups[firstCol] = [];
             groups[firstCol].push(project);
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
    const { active, over } = event;
    setActiveProject(null);
    setTimeout(() => { dragHappened.current = false; }, 0);

    if (!over) return;

    const activeId = String(active.id);
    const activeContainer = active.data.current?.sortable.containerId as string;
    const overIsItem = !!over.data.current?.sortable;
    const overContainer = overIsItem ? over.data.current?.sortable.containerId as string : String(over.id);
    
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
      <DragOverlay dropAnimation={dropAnimation}>
        {activeProject ? (
          <KanbanCard project={activeProject} dragHappened={dragHappened} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanView;