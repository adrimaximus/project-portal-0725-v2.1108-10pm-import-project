import { Task } from "@/types";
import TaskReactions from './TaskReactions';
import TaskDiscussion from './TaskDiscussion';

interface TaskFooterProps {
  task: Task;
  onToggleReaction: (emoji: string) => void;
}

const TaskFooter = ({ task, onToggleReaction }: TaskFooterProps) => {
  return (
    <div className="space-y-4">
      <TaskReactions reactions={task.reactions || []} onToggleReaction={onToggleReaction} />
      <TaskDiscussion task={task} />
    </div>
  );
};

export default TaskFooter;