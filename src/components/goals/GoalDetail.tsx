import { useState } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ChevronDown, LucideIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import IconPicker from './IconPicker';
import { CustomColorPicker } from './CustomColorPicker';

interface GoalDetailProps {
  goal: Goal;
  onUpdate: (goal: Goal) => void;
  onClose?: () => void;
  isCreateMode?: boolean;
}

const GoalDetail = ({ goal, onUpdate, onClose, isCreateMode = false }: GoalDetailProps) => {
  const [editedGoal, setEditedGoal] = useState<Goal>(goal);

  const parseFrequency = (freq: string): { days: number, weeks: number } => {
    const daysMatch = freq.match(/Every (\d+)/);
    const weeksMatch = freq.match(/for (\d+)/);

    let days = 1;
    if (daysMatch) {
      days = parseInt(daysMatch[1], 10);
    } else if (freq === 'Once a week') {
      days = 7;
    }

    const weeks = weeksMatch ? parseInt(weeksMatch[1], 10) : 1;

    return { days, weeks };
  };

  const initialFrequency = parseFrequency(goal.frequency);
  const [frequencyValue, setFrequencyValue] = useState<number | string>(initialFrequency.days);
  const [durationValue, setDurationValue] = useState<number | string>(initialFrequency.weeks);

  const handleSave = () => {
    const numDays = typeof frequencyValue === 'number' ? frequencyValue : parseInt(frequencyValue as string, 10);
    const finalDays = !isNaN(numDays) && numDays > 0 ? numDays : 1;

    const numWeeks = typeof durationValue === 'number' ? durationValue : parseInt(durationValue as string, 10);
    const finalWeeks = !isNaN(numWeeks) && numWeeks > 0 ? numWeeks : 1;

    const newFrequencyString = `Every ${finalDays} day${finalDays > 1 ? 's' : ''} for ${finalWeeks} week${finalWeeks > 1 ? 's' : ''}`;
    
    onUpdate({ ...editedGoal, frequency: newFrequencyString });
  };

  const handleIconSelect = (icon: LucideIcon) => {
    setEditedGoal({ ...editedGoal, icon });
  };

  const getIconBackgroundColor = () => {
    const color = editedGoal.color;
    if (color.startsWith('#')) {
      let fullHex = color;
      if (color.length === 4) {
        fullHex = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
      }
      if (fullHex.length === 7) {
        return `${fullHex}33`;
      }
    }
    return 'rgba(128, 128, 128, 0.2)';
  }

  const freqNum = parseInt(frequencyValue.toString(), 10) || 1;
  const durNum = parseInt(durationValue.toString(), 10) || 1;

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setFrequencyValue('');
    } else {
      let num = parseInt(val, 10);
      if (num > 7) num = 7;
      if (num < 1 && val !== '') num = 1;
      setFrequencyValue(num);
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setDurationValue('');
    } else {
      let num = parseInt(val, 10);
      if (num > 4) num = 4;
      if (num < 1 && val !== '') num = 1;
      setDurationValue(num);
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="goal-title">Goal Title</Label>
        <Input
          id="goal-title"
          value={editedGoal.title}
          onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
          placeholder="e.g. Read 10 pages"
        />
      </div>
      
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label>Icon</Label>
          <IconPicker onSelectIcon={handleIconSelect} currentColor={editedGoal.color}>
            <Button variant="outline" className="w-full mt-1 flex items-center justify-between h-10 px-3">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg" style={{ backgroundColor: getIconBackgroundColor() }}>
                  <editedGoal.icon className="h-5 w-5" style={{ color: editedGoal.color }} />
                </div>
                <span className="text-sm">Select Icon</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </IconPicker>
        </div>
        <div>
          <Label>Color</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full mt-1 justify-start px-2 h-10">
                <div className="w-5 h-5 rounded-full mr-2 border" style={{ backgroundColor: editedGoal.color }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <CustomColorPicker
                color={editedGoal.color}
                onChange={(newColor) => setEditedGoal({ ...editedGoal, color: newColor })}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="frequency">Frequency</Label>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Every</span>
          <Input
            id="frequency"
            type="number"
            min="1"
            max="7"
            value={frequencyValue}
            onChange={handleFrequencyChange}
            className="w-20"
            placeholder="e.g. 1"
          />
          <span className="text-sm text-muted-foreground">
            {freqNum === 1 ? 'day' : 'days'}
          </span>
          <span className="text-sm text-muted-foreground">for</span>
          <Input
            id="duration"
            type="number"
            min="1"
            max="4"
            value={durationValue}
            onChange={handleDurationChange}
            className="w-20"
            placeholder="e.g. 1"
          />
          <span className="text-sm text-muted-foreground">
            {durNum === 1 ? 'week' : 'weeks'}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 mt-4 border-t">
        <div>
          {!isCreateMode && (
            <Button variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {onClose && <Button variant="ghost" onClick={onClose}>Cancel</Button>}
          <Button onClick={handleSave}>
            {isCreateMode ? 'Create Goal' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoalDetail;