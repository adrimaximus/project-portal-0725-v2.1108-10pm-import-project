import { useState, useEffect } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TwitterPicker } from 'react-color';
import IconPicker from './IconPicker';
import type { LucideIcon } from 'lucide-react';
import { Target } from 'lucide-react';

interface GoalDetailProps {
  goal?: Goal;
  onUpdate: (goal: Goal) => void;
  onClose: () => void;
}

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const GoalDetail = ({ goal, onUpdate, onClose }: GoalDetailProps) => {
  const isNew = !goal;
  const [editedGoal, setEditedGoal] = useState<Omit<Goal, 'id' | 'completions'>>(
    isNew
      ? { title: '', frequency: 'Daily', icon: Target, color: '#3b82f6', specificDays: [], invitedUsers: [] }
      : { ...goal }
  );
  const [selectedFrequency, setSelectedFrequency] = useState<Goal['frequency']>(editedGoal.frequency);
  const [selectedDays, setSelectedDays] = useState<string[]>(editedGoal.specificDays || []);

  useEffect(() => {
    if (selectedFrequency !== 'Weekly') {
      setSelectedDays([]);
    }
  }, [selectedFrequency]);

  const handleSave = () => {
    const finalGoal: Goal = {
      ...editedGoal,
      id: goal?.id || new Date().toISOString(),
      completions: goal?.completions || [],
      frequency: selectedFrequency,
      specificDays: selectedDays,
    };
    onUpdate(finalGoal);
  };

  const handleIconSelect = (icon: LucideIcon) => {
    setEditedGoal(prev => ({ ...prev, icon }));
  };

  const getIconBackgroundColor = () => `${editedGoal.color}20`;

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label htmlFor="title">Goal Title</Label>
        <Input
          id="title"
          value={editedGoal.title}
          onChange={(e) => setEditedGoal(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Read 10 books"
        />
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-grow">
          <Label>Icon & Color</Label>
          <IconPicker onSelectIcon={handleIconSelect} currentColor={editedGoal.color}>
            <Button variant="outline" className="w-full mt-1 flex items-center justify-between h-10 px-3">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg" style={{ backgroundColor: getIconBackgroundColor() }}>
                  <editedGoal.icon className="h-5 w-5" style={{ color: editedGoal.color }} />
                </div>
                <span>Select Icon</span>
              </div>
            </Button>
          </IconPicker>
        </div>
        <TwitterPicker
          color={editedGoal.color}
          onChangeComplete={(color) => setEditedGoal(prev => ({ ...prev, color: color.hex }))}
          triangle="hide"
          styles={{ default: { card: { boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: '0.375rem' } } }}
        />
      </div>

      <div>
        <Label htmlFor="frequency">Frequency</Label>
        <Select value={selectedFrequency} onValueChange={(value) => setSelectedFrequency(value as Goal['frequency'])}>
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Daily">Daily</SelectItem>
            <SelectItem value="Weekly">Weekly</SelectItem>
            <SelectItem value="Monthly">Monthly</SelectItem>
            <SelectItem value="Yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedFrequency === 'Weekly' && (
        <div>
          <Label>Specific days of the week</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {weekDays.map((day, index) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={day}
                  checked={selectedDays.includes(String(index))}
                  onCheckedChange={(checked) => {
                    const dayIndex = String(index);
                    if (checked) {
                      setSelectedDays(prev => [...prev, dayIndex]);
                    } else {
                      setSelectedDays(prev => prev.filter(d => d !== dayIndex));
                    }
                  }}
                />
                <Label htmlFor={day} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {day}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default GoalDetail;