import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Task, Reaction, User, Comment as CommentType, UpsertTaskPayload } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectOverviewTab from './ProjectOverviewTab';
import ProjectTasks from '../projects/ProjectTasks';
import ProjectActivityFeed from './ProjectActivityFeed';
import { LayoutGrid, ListChecks, MessageSquare, Activity } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useProfiles } from '@/hooks/useProfiles';
import ProjectComments from '@/components/project-detail/ProjectComments';

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
  mutations: {
    addFiles: any;
    deleteFile: any;
  };
  defaultTab: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
  highlightedTaskId: string | null;
  onHighlightComplete: () => void;
  onSetIsEditing: (isEditing: boolean) => void;
  isUploading: boolean;
  onSaveChanges: () => void;
  onOpenTaskModal: (task?: Task | null, initialData?: Partial<UpsertTaskPayload>, project?: Project | null) => void;
}

const ProjectMainContent = ({ 
  project, 
  isEditing, 
  onFieldChange, 
  mutations, 
  defaultTab,
  onEditTask,
  onDeleteTask,
  onToggleTaskCompletion,
  highlightedTaskId,
  onHighlightComplete,
  onSetIsEditing,
  isUploading,
  onSaveChanges,
  onOpenTaskModal,
}: ProjectMainContentProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [lastViewedDiscussion, setLastViewedDiscussion] = useState(() => new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialMention, setInitialMention] = useState<{ id: string; name: string } | null>(null);
  const { data: allUsers = [] } = useProfiles();

  const handleMentionConsumed = useCallback(() => {
    setInitialMention(null);
  }, []);

  useEffect(() => {
    const mentionId = searchParams.get('mention');
    const mentionName = searchParams.get('mentionName');

    if (mentionId && mentionName) {
      setActiveTab('discussion');
      setInitialMention({ id: mentionId, name: mentionName });
      
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('mention');
      newSearchParams.delete('mentionName');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'discussion') {
      setLastViewedDiscussion(new Date());
    }
  };

  const newCommentsCount = project.comments?.filter(
    comment => comment.author.id !== project.created_by.id && new Date(comment.created_at) > lastViewedDiscussion
  ).length ?? 0;

  const uncompletedTasksCount = project.tasks?.filter(task => !task.completed).length ?? 0;

  return (
    <div className="p-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <LayoutGrid className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListChecks className="w-4 h-4 mr-2" />
            Tasks
            {uncompletedTasksCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
                {uncompletedTasksCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="discussion">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discussion
            {newCommentsCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                {newCommentsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <ProjectOverviewTab
            project={project}
            isEditing={isEditing}
            onDescriptionChange={(value) => onFieldChange('description', value)}
            onFilesAdd={(files) => mutations.addFiles.mutate({ files, project, user: project.created_by })}
            onFileDelete={(fileId) => {
              const file = project.briefFiles.find(f => f.id === fileId);
              if (file) mutations.deleteFile.mutate(file);
            }}
            onServicesChange={(services) => onFieldChange('services', services)}
            onTagsChange={(tags) => onFieldChange('tags', tags)}
            onReactionsChange={(reactions) => onFieldChange('reactions', reactions)}
            onSetIsEditing={onSetIsEditing}
            isUploading={isUploading}
            onSaveChanges={onSaveChanges}
          />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <ProjectTasks
            project={project}
            tasks={project.tasks || []}
            projectId={project.id}
            projectSlug={project.slug}
            onEditTask={(task) => onOpenTaskModal(task, undefined, project)}
            onDeleteTask={onDeleteTask}
            onToggleTaskCompletion={onToggleTaskCompletion}
            highlightedTaskId={searchParams.get('task')}
            onHighlightComplete={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('task');
              setSearchParams(newParams, { replace: true });
            }}
          />
        </TabsContent>
        <TabsContent value="discussion" className="mt-4">
          <ProjectComments
            project={project}
            initialMention={initialMention}
            onMentionConsumed={handleMentionConsumed}
            allUsers={allUsers}
          />
        </TabsContent>
        <TabsContent value="activity" className="mt-4 h-[350px] overflow-y-auto pr-4">
          <ProjectActivityFeed activities={project.activities || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectMainContent;