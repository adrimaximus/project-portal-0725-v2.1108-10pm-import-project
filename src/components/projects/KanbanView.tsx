import React, { useMemo, useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Project, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatInJakarta, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { CheckCircle } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import { useKanbanDnd } from '@/hooks/useKanbanDnd';
import { isSameDay, subDays } from 'date-fns';

const KanbanView = ({ projects, groupBy }: { projects: Project[], groupBy: 'status' | 'payment_status' }) => {
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
    return groups;
  }, [projects, columns, groupBy]);

  const { 
    activeProject, 
    dragHappened, 
    handleDragStart, 
    handleDragEnd, 
    handleDragCancel 
  } = useKanbanDnd(projects, groupBy, columns);

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
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
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
                        <AvatarImage src={user.avatar_url} />
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