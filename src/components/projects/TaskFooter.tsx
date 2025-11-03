import { Task } from '@/types';
import TaskReactions from './TaskReactions';

interface TaskFooterProps {
  task: Task;
  onToggleReaction: (emoji: string) => void;
}

const TaskFooter = ({ task, onToggleReaction }: TaskFooterProps) => {
  return (
    <div className="border-t pt-4">
      <h4 className="font-semibold mb-2 text-sm">Reactions</h4>
      <TaskReactions reactions={task.reactions || []} onToggleReaction={onToggleReaction} />
    </div>
  );
};

export default TaskFooter;