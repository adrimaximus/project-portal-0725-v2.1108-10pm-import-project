import { useState } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ChevronDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import IconPicker from './IconPicker';
import { CustomColorPicker } from './CustomColorPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect, Option } from '@/components/ui/MultiSelect';

interface GoalDetailProps {
  goal: Goal;
  onUpdate: (goal: Goal) => void;
  onClose?: () => void;
  isCreateMode?: boolean;
}

const dayOptions: Option[] = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
];

const GoalDetail = ({ goal, onUpdate, onClose, isCreateMode = false }: GoalDetailProps) => {
  const [editedGoal, setEditedGoal] = useState<Goal>(goal);

  const parseFrequency = (freq: string): { type: 'interval' | 'weekly', intervalDays: string, weeklyDays: string[] } => {
    if (freq.startsWith('weekly:')) {
      const days = freq.split(':')[1].split(',').filter(d => d);
      return { type: 'weekly', intervalDays: '7', weeklyDays: days };
    }

    const daysMatch = freq.match(/Every (\d+)/);
    let daysValue = "1";
    if (daysMatch) {
      daysValue = daysMatch[1];
    } else if (freq.toLowerCase().includes('week')) {
      daysValue = "7";
    } else if (freq.toLowerCase().includes('daily')) {
      daysValue = "1";
    }
    return { type: 'interval', intervalDays: daysValue, weeklyDays: [] };
  };

  const initialFrequency = parseFrequency(goal.frequency);

  const [frequencyType, setFrequencyType] = useState<'interval' | 'weekly'>(initialFrequency.type);
  const [intervalDays, setIntervalDays] = useState<string>(initialFrequency.intervalDays);
  const [weeklyDays, setWeeklyDays] = useState<string[]>(initialFrequency.weeklyDays);

  const handleSave = () => {
    let newFrequencyString = '';

    if (frequencyType === 'interval') {
      const finalDays = parseInt(intervalDays, 10) || 1;
      newFrequencyString = `Every ${finalDays} day${finalDays > 1 ? 's' : ''} for 1 week`;
    } else {
      newFrequencyString = `weekly:${weeklyDays.join(',')}`;
    }
    
    onUpdate({ ...editedGoal, frequency: newFrequencyString });
  };

  const handleIconSelect = (icon: React.ElementType) => {
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

  const isSaveDisabled = frequencyType === 'weekly' && weeklyDays.length === 0;

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="goal-title">Goal Title</Label>
        <Input
          id="goal-title"
          value={editedGoal.title}
          onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
          placeholder="e.g., Read 10 pages"
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
        <Tabs value={frequencyType} onValueChange={(value) => setFrequencyType(value as 'interval' | 'weekly')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="interval">Interval</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
          <TabsContent value="interval" className="pt-2">
            <Select value={intervalDays} onValueChange={setIntervalDays}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Every day</SelectItem>
                <SelectItem value="2">Every 2 days</SelectItem>
                <SelectItem value="3">Every 3 days</SelectItem>
                <SelectItem value="4">Every 4 days</SelectItem>
                <SelectItem value="5">Every 5 days</SelectItem>
                <SelectItem value="6">Every 6 days</SelectItem>
                <SelectItem value="7">Once a week</SelectItem>
              </SelectContent>
            </Select>
          </TabsContent>
          <TabsContent value="weekly" className="pt-2">
            <MultiSelect
              options={dayOptions}
              selected={weeklyDays}
              onChange={setWeeklyDays}
              placeholder="Select days..."
            />
          </TabsContent>
        </Tabs>
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
          <Button onClick={handleSave} disabled={isSaveDisabled}>
            {isCreateMode ? 'Create Goal' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoalDetail;