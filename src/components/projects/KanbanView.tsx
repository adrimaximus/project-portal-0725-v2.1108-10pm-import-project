import { useState, useMemo, useEffect } from 'react';
import { Project, PROJECT_STATUS_OPTIONS, ProjectStatus } from '@/types';
import KanbanColumn from './KanbanColumn';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import KanbanCard from './KanbanCard';
import { createPortal } from 'react-dom';

interface KanbanViewProps {
  projects: Project[];
}

const KanbanView = ({ projects }: KanbanViewProps) => {
  const queryClient = useQueryClient();
  const [projectList, setProjectList] = useState(projects);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    setProjectList(projects);
  }, [projects]);

  const columns = useMemo(() => {
    return PROJECT_STATUS_OPTIONS.map(option => option.value);
  }, []);

  const projectsByStatus = useMemo(() => {
    const grouped: { [key: string]: Project[] } = {};
    columns.forEach(status => {
      grouped[status] = [];
    });
    projectList.forEach(project => {
      if (grouped[project.status]) {
        grouped[project.status].push(project);
      }
    });
    return grouped;
  }, [projectList, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require the user to press and hold for 250ms, or drag the item by 5px before a drag is initiated
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Project') {
      setActiveProject(event.active.data.current.project);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveProject(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const activeProject = projectList.find(p => p.id === activeId);
    if (!activeProject) return;

    const overIsColumn = over.data.current?.type === 'Column';
    const newStatus = overIsColumn ? overId : projectList.find(p => p.id === overId)?.status;

    if (newStatus && activeProject.status !== newStatus) {
      
      // Optimistic update
      const updatedProjectList = projectList.map(p => 
        p.id === activeId ? { ...p, status: newStatus as ProjectStatus } : p
      );
      setProjectList(updatedProjectList);

      // Update database
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', activeId);

      if (error) {
        toast.error(`Failed to update project status: ${error.message}`);
        // Revert optimistic update
        setProjectList(projectList);
      } else {
        toast.success(`Project "${activeProject.name}" moved to ${newStatus}.`);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            projects={projectsByStatus[status]}
          />
        ))}
      </div>
      {createPortal(
        <DragOverlay>
          {activeProject && <KanbanCard project={activeProject} />}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};

export default KanbanView;