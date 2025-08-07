import { Project, Task, Comment } from "@/data/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectActivityFeed from "./ProjectActivityFeed";
import { ProjectTasks } from "./ProjectTasks";
import ProjectComments from "@/components/ProjectComments";
import { User } from "@/data/users";

interface ProjectMainContentProps {
  project: Project;
  onUpdateTasks: (tasks: Task[]) => void;
  onTaskStatusChange: (taskId: string, completed: boolean) => void;
  onTaskDelete: (taskId: string) => void;
  onAddCommentOrTicket: (comment: Comment) => void;
}

export const ProjectMainContent = ({
  project,
  onUpdateTasks,
  onTaskStatusChange,
  onTaskDelete,
  onAddCommentOrTicket,
}: ProjectMainContentProps) => {
  const handleTaskCreate = (taskName: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskName,
      completed: false,
    };
    onUpdateTasks([...(project.tasks || []), newTask]);
  };

  const handleTaskUpdate = (taskId: string, updatedTask: Partial<Task>) => {
    const updatedTasks = (project.tasks || []).map(task => 
      task.id === taskId ? { ...task, ...updatedTask } : task
    );
    onUpdateTasks(updatedTasks);
  };

  const handleTaskOrderChange = (taskIds: string[]) => {
    const reorderedTasks = taskIds.map(id => (project.tasks || []).find(t => t.id === id)).filter(Boolean) as Task[];
    onUpdateTasks(reorderedTasks);
  };

  const handleAssignUserToTask = (taskId: string, users: User[]) => {
    const updatedTasks = (project.tasks || []).map(task => 
      task.id === taskId ? { ...task, assignedTo: users } : task
    );
    onUpdateTasks(updatedTasks);
  };

  return (
    <Tabs defaultValue="tasks" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="comments">Comments & Tickets</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="tasks">
        <ProjectTasks
          project={project}
          tasks={project.tasks || []}
          onTaskCreate={handleTaskCreate}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={onTaskDelete}
          onTaskOrderChange={handleTaskOrderChange}
          onAssignUserToTask={handleAssignUserToTask}
        />
      </TabsContent>
      <TabsContent value="comments">
        <ProjectComments project={project} onAddCommentOrTicket={onAddCommentOrTicket} />
      </TabsContent>
      <TabsContent value="activity">
        <ProjectActivityFeed activities={project.activities || []} />
      </TabsContent>
    </Tabs>
  );
};