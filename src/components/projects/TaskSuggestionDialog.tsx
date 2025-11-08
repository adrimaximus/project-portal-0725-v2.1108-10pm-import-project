import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface TaskSuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: string[];
  onAddTasks: (selectedTasks: string[]) => void;
  isLoading: boolean;
}

const TaskSuggestionDialog = ({ isOpen, onClose, suggestions, onAddTasks, isLoading }: TaskSuggestionDialogProps) => {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTasks(suggestions);
    }
  }, [isOpen, suggestions]);

  const handleToggle = (taskTitle: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskTitle) 
        ? prev.filter(t => t !== taskTitle) 
        : [...prev, taskTitle]
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
                  checked={selectedTasks.includes(suggestion)}
                  onCheckedChange={() => handleToggle(suggestion)}
                />
                <Label htmlFor={`suggestion-${index}`} className="text-sm font-normal cursor-pointer">
                  {suggestion}
                </Label>
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