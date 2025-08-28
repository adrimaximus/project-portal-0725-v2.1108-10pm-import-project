import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectStatus, PaymentStatus } from '@/types';

type GroupBy = 'status' | 'payment_status';

export const useKanbanDnd = (
    projects: Project[],
    groupBy: GroupBy,
    projectGroups: Record<string, Project[]>,
    columns: readonly { value: string; label: string }[]
) => {
    const queryClient = useQueryClient();
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const dragHappened = useRef(false);

    useEffect(() => {
        if (activeProject) {
            dragHappened.current = true;
        }
    }, [activeProject]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveProject(projects.find(p => p.id === event.active.id) || null);
    };

    const resetDragState = () => {
        setActiveProject(null);
        setTimeout(() => {
            dragHappened.current = false;
        }, 0);
    };

    const handleDragCancel = () => {
        resetDragState();
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        resetDragState();

        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        const activeContainer = active.data.current?.sortable.containerId as string;
        let overContainer = over.data.current?.sortable.containerId as string;
        if (!overContainer) {
            overContainer = overId;
        }
        
        const activeProjectInstance = projects.find(p => p.id === activeId);
        if (!activeProjectInstance || !activeContainer || !overContainer) return;

        const originalProjects = [...projects];
        const newProjectGroups = JSON.parse(JSON.stringify(projectGroups));

        if (activeContainer === overContainer) {
            if (activeId === overId) return;

            const items = newProjectGroups[activeContainer];
            const oldIndex = items.findIndex((p: Project) => p.id === activeId);
            const newIndex = items.findIndex((p: Project) => p.id === overId);

            if (oldIndex !== -1 && newIndex !== -1) {
                newProjectGroups[activeContainer] = arrayMove(items, oldIndex, newIndex);
            }
        } else {
            const sourceItems = newProjectGroups[activeContainer];
            const destinationItems = newProjectGroups[overContainer];
            
            const activeIndex = sourceItems.findIndex((p: Project) => p.id === activeId);
            if (activeIndex === -1) return;

            const [movedItem] = sourceItems.splice(activeIndex, 1);
            movedItem[groupBy] = overContainer as ProjectStatus | PaymentStatus;

            const overIsItem = !!over.data.current?.sortable;
            let newIndex;

            if (overIsItem) {
                newIndex = destinationItems.findIndex((p: Project) => p.id === overId);
            } else {
                newIndex = destinationItems.length;
            }

            if (newIndex === -1) {
                newIndex = destinationItems.length;
            }
            
            destinationItems.splice(newIndex, 0, movedItem);
        }

        const optimisticallyUpdatedProjects = Object.values(newProjectGroups).flat();
        queryClient.setQueryData(['projects'], optimisticallyUpdatedProjects);

        const affectedGroups = new Set([activeContainer, overContainer]);
        const finalUpdates = [];

        for (const groupKey of affectedGroups) {
            const items = newProjectGroups[groupKey] || [];
            items.forEach((project: Project, index: number) => {
                finalUpdates.push({
                    project_id: project.id,
                    kanban_order: index,
                    [groupBy]: groupKey,
                });
            });
        }

        if (finalUpdates.length === 0) return;

        const { error } = await supabase.rpc('update_project_kanban_order', {
            updates: finalUpdates,
            group_by_key: groupBy,
        });

        if (error) {
            toast.error(`Failed to move project: ${error.message}`);
            queryClient.setQueryData(['projects'], originalProjects);
        } else {
            const newStatusLabel = columns.find(opt => opt.value === overContainer)?.label || overContainer;
            if (activeContainer === overContainer) {
                toast.success(`Project order updated in ${newStatusLabel}.`);
            } else {
                toast.success(`Project "${activeProjectInstance.name}" moved to ${newStatusLabel}.`);
            }
            await queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    };

    return {
        activeProject,
        dragHappened,
        handleDragStart,
        handleDragEnd,
        handleDragCancel,
    };
};