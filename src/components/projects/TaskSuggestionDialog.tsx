import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getPriorityStyles } from '@/lib/utils';
import { TaskPriority } from '@/types';

export interface TaskSuggestion {
  title: string;
  priority: TaskPriority;
}

interface TaskSuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: TaskSuggestion[];
  onAddTasks: (selectedTasks: TaskSuggestion[]) => void;
  isLoading: boolean;
}

const TaskSuggestionDialog = ({ isOpen, onClose, suggestions, onAddTasks, isLoading }: TaskSuggestionDialogProps) => {
  const [selectedTasks, setSelectedTasks] = useState<TaskSuggestion[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTasks(suggestions);
    }
  }, [isOpen, suggestions]);

  const handleToggle = (task: TaskSuggestion) => {
    setSelectedTasks(prev => 
      prev.some(t => t.title === task.title) 
        ? prev.filter(t => t.title !== task.title) 
        : [...prev, task]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Task Suggestions</DialogTitle>
          <DialogDescription>Select the tasks you want to add to the project.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-80">
          <div className="space-y-3 pr-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                <Checkbox
                  id={`suggestion-${index}`}
                  checked={selectedTasks.some(t => t.title === suggestion.title)}
                  onCheckedChange={() => handleToggle(suggestion)}
                />
                <Label htmlFor={`suggestion-${index}`} className="text-sm font-normal cursor-pointer flex-1">
                  {suggestion.title}
                </Label>
                <Badge className={getPriorityStyles(suggestion.priority).tw}>{suggestion.priority}</Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onAddTasks(selectedTasks)} disabled={isLoading || selectedTasks.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {selectedTasks.length} Task(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskSuggestionDialog;