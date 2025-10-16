import { useState, useRef } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectStatus, PaymentStatus } from '@/types';

type GroupBy = 'status' | 'payment_status';

type UpdateProjectOrderPayload = {
    newProjects: Project[];
    finalUpdates: any[];
    groupBy: GroupBy;
    activeProjectName: string;
    newStatusLabel: string;
    movedColumns: boolean;
};

export const useKanbanDnd = (
    projects: Project[],
    groupBy: GroupBy,
    columns: readonly { value: string; label: string }[]
) => {
    const queryClient = useQueryClient();
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const dragHappened = useRef(false);

    const { mutate: updateProjectOrder } = useMutation({
        mutationFn: async ({ finalUpdates, groupBy }: UpdateProjectOrderPayload) => {
            const { error } = await supabase.rpc('update_project_kanban_order', {
                updates: finalUpdates,
                group_by_key: groupBy,
            });
            if (error) throw error;
        },
        onMutate: async ({ newProjects }) => {
            await queryClient.cancelQueries({ queryKey: ['projects'] });
            const previousProjects = queryClient.getQueryData<Project[]>(['projects']);
            queryClient.setQueryData(['projects'], newProjects);
            return { previousProjects };
        },
        onError: (err: any, variables, context) => {
            if (context?.previousProjects) {
                queryClient.setQueryData(['projects'], context.previousProjects);
            }
            toast.error(`Failed to move project: ${err.message}`);
        },
        onSuccess: (_, { activeProjectName, newStatusLabel, movedColumns }) => {
            if (movedColumns) {
                toast.success(`Project "${activeProjectName}" moved to ${newStatusLabel}.`);
            } else {
                toast.success(`Project order updated in ${newStatusLabel}.`);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const handleDragStart = (event: DragStartEvent) => {
        setActiveProject(projects.find(p => p.id === event.active.id) || null);
        dragHappened.current = true;
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

    const handleDragEnd = (event: DragEndEvent) => {
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

        const projectGroups = columns.reduce((acc, opt) => {
            acc[opt.value] = projects.filter(p => p[groupBy] === opt.value);
            return acc;
        }, {} as Record<string, Project[]>);

        if (activeContainer === overContainer) {
            if (activeId === overId) return;

            const items = projectGroups[activeContainer];
            const oldIndex = items.findIndex((p: Project) => p.id === activeId);
            const newIndex = items.findIndex((p: Project) => p.id === overId);

            if (oldIndex !== -1 && newIndex !== -1) {
                projectGroups[activeContainer] = arrayMove(items, oldIndex, newIndex);
            }
        } else {
            const sourceItems = projectGroups[activeContainer];
            const destinationItems = projectGroups[overContainer];
            
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

        const optimisticallyUpdatedProjects = Object.values(projectGroups).flat();
        
        const affectedGroups = new Set([activeContainer, overContainer]);
        const finalUpdates: any[] = [];

        for (const groupKey of affectedGroups) {
            const items = projectGroups[groupKey] || [];
            items.forEach((project: Project, index: number) => {
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
                newProjects: optimisticallyUpdatedProjects,
                finalUpdates,
                groupBy,
                activeProjectName: activeProjectInstance.name,
                newStatusLabel,
                movedColumns: activeContainer !== overContainer,
            });
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