import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProjectCombobox } from '@/components/projects/ProjectCombobox';
import { useProjects } from '@/hooks/useProjects';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

const QuickAddWidget = () => {
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { user } = useAuth();
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects({ excludeOtherPersonal: true });
  const { upsertTask, isUpserting } = useTaskMutations();

  const projects = useMemo(() => projectsData?.pages.flatMap(page => page.projects) ?? [], [projectsData]);

  const handleAddTask = async () => {
    if (!taskTitle.trim()) {
      toast.error("Please enter a task title.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    let projectId = selectedProjectId;
    if (!projectId) {
        const personalProject = projects.find(p => p.personal_for_user_id === user.id);
        if (personalProject) {
            projectId = personalProject.id;
        } else {
            const { data: generalProjectId, error } = await supabase.rpc('ensure_general_tasks_project_and_membership');
            if (error) {
                toast.error("Could not find or create a default project for your task.");
                return;
            }
            projectId = generalProjectId;
        }
    }

    upsertTask({
      project_id: projectId,
      title: taskTitle,
      status: 'To do',
      assignee_ids: [user.id], // Assign to self by default
    }, {
      onSuccess: () => {
        toast.success(`Task "${taskTitle}" added.`);
        setTaskTitle('');
        setSelectedProjectId(null);
      }
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Add Task</CardTitle>
        <CardDescription>Quickly add a new task to a project.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="What needs to be done?"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddTask();
              }
            }}
          />
          <ProjectCombobox
            projects={projects as Project[]}
            value={selectedProjectId || ''}
            onChange={(value) => setSelectedProjectId(value)}
            isLoading={isLoadingProjects}
          />
          <Button onClick={handleAddTask} disabled={isUpserting} className="w-full">
            {isUpserting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add Task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAddWidget;