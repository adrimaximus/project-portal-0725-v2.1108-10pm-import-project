import { useState, useEffect } from 'react';
import React from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ChevronDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import IconPicker from './IconPicker';
import { CustomColorPicker } from './CustomColorPicker';
import DayOfWeekPicker from './DayOfWeekPicker';

interface GoalDetailProps {
  goal: Goal;
  onUpdate: (goal: Goal) => void;
  onClose?: () => void;
  isCreateMode?: boolean;
}

const GoalDetail = ({ goal, onUpdate, onClose, isCreateMode = false }: GoalDetailProps) => {
  const [editedGoal, setEditedGoal] = useState<Goal>(goal);

  const getInitialFrequencyType = (g: Goal) => {
    if (g.specificDays && g.specificDays.length > 0) {
      return 'specific_days';
    }
    if (g.frequency.startsWith('Every 1 day')) {
      return 'daily';
    }
    if (g.frequency) {
        return 'specific_days';
    }
    return 'daily';
  };

  const [frequencyType, setFrequencyType] = useState<'daily' | 'specific_days'>(getInitialFrequencyType(goal));
  const [selectedDays, setSelectedDays] = useState<string[]>(goal.specificDays || []);

  useEffect(() => {
    if (selectedDays.length === 7) {
      setFrequencyType('daily');
    }
  }, [selectedDays]);

  const handleFrequencyChange = (value: string) => {
    const newFrequencyType = value as 'daily' | 'specific_days';
    setFrequencyType(newFrequencyType);

    if (newFrequencyType === 'specific_days' && selectedDays.length === 7) {
      setSelectedDays([]);
    }
  };

  const handleSave = () => {
    let finalFrequency = '';
    let finalSpecificDays: string[] | undefined = undefined;

    if (frequencyType === 'daily') {
      finalFrequency = 'Every 1 day for 1 week';
      finalSpecificDays = undefined;
    } else {
      finalFrequency = `On ${selectedDays.length} specific day(s) for 1 week`;
      finalSpecificDays = selectedDays;
    }
    
    onUpdate({ ...editedGoal, frequency: finalFrequency, specificDays: finalSpecificDays });
  };

  const handleIconSelect = (icon: React.ElementType) => {
    setEditedGoal({ ...editedGoal, icon: icon });
  };

  const handleDayToggle = (dayKey: string) => {
    setSelectedDays(prev => 
      prev.includes(dayKey) ? prev.filter(d => d !== dayKey) : [...prev, dayKey]
    );
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
                <div className="p-1 rounded-lg flex items-center justify-center w-7 h-7" style={{ backgroundColor: getIconBackgroundColor() }}>
                  <editedGoal.icon style={{ fontSize: '20px' }} twoToneColor={editedGoal.color} />
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
        <Select value={frequencyType} onValueChange={handleFrequencyChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Every day</SelectItem>
            <SelectItem value="specific_days">Specific days of the week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {frequencyType === 'specific_days' && (
        <div className="grid gap-2 pt-2">
            <Label className="text-center mb-2">On which days?</Label>
            <DayOfWeekPicker selectedDays={selectedDays} onDayToggle={handleDayToggle} />
        </div>
      )}

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
          <Button onClick={handleSave} disabled={frequencyType === 'specific_days' && selectedDays.length === 0}>
            {isCreateMode ? 'Create Goal' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoalDetail;