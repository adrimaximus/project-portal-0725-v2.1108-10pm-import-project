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
        resetDragState();
        const { active, over } = event;

        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);
        
        const activeContainer = active.data.current?.sortable.containerId as string;
        const overContainer = over.data.current?.sortable.containerId as string || over.id as string;

        const activeProjectInstance = projects.find(p => p.id === activeId);
        if (!activeProjectInstance) return;

        const originalProjects = [...projects];

        if (activeContainer === overContainer) {
            if (activeId === overId) return;
            
            const items = projectGroups[activeContainer];
            const oldIndex = items.findIndex(p => p.id === activeId);
            const newIndex = items.findIndex(p => p.id === overId);

            if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
                const reorderedItems = arrayMove(items, oldIndex, newIndex);
                
                const newProjects = [...originalProjects];
                reorderedItems.forEach((p, index) => {
                    const projectInNew = newProjects.find(proj => proj.id === p.id);
                    if (projectInNew) {
                        projectInNew.kanban_order = index;
                    }
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
            
            const activeItemIndex = sourceItems.findIndex(p => p.id === activeId);
            if (activeItemIndex === -1) return;
            const [movedItem] = sourceItems.splice(activeItemIndex, 1);
            
            const overIndex = destinationItems.findIndex(p => p.id === overId);
            const newIndex = overIndex >= 0 ? overIndex : destinationItems.length;
            
            destinationItems.splice(newIndex, 0, { ...movedItem, [groupBy]: newGroupValue as ProjectStatus | PaymentStatus });

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
                [groupBy]: project[groupBy],
            }));
            const destinationUpdates = destinationItems.map((project, index) => ({
                project_id: project.id,
                kanban_order: index,
                [groupBy]: project[groupBy],
            }));

            const allUpdates = [...sourceUpdates, ...destinationUpdates];

            const { error } = await supabase.rpc('update_project_kanban_order', { updates: allUpdates });

            if (error) {
                toast.error(`Failed to move project: ${error.message}`);
                queryClient.setQueryData(['projects'], originalProjects);
            } else {
                const newStatusLabel = columns.find(opt => opt.value === newGroupValue)?.label || newGroupValue;
                toast.success(`Project "${activeProjectInstance.name}" moved to ${newStatusLabel}.`);
                queryClient.invalidateQueries({ queryKey: ['projects'] });
            }
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