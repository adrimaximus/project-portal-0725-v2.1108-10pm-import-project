import { useState } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import IconPicker from './IconPicker';
import ColorPicker from './ColorPicker';
import { getIconComponent } from '@/data/icons';

interface GoalDetailProps {
  goal: Goal;
  onUpdateGoal: (updatedGoal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

const weekDays = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

const GoalDetail = ({ goal, onUpdateGoal, onDeleteGoal }: GoalDetailProps) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const [title, setTitle] = useState(goal.title);
  const [frequency, setFrequency] = useState<Goal['frequency']>(goal.frequency);
  const [specificDays, setSpecificDays] = useState<number[]>(goal.specificDays || []);
  const [icon, setIcon] = useState(goal.icon);
  const [color, setColor] = useState(goal.color);

  const IconComponent = getIconComponent(icon);

  const handleSave = () => {
    const updatedGoal: Goal = {
      ...goal,
      title,
      frequency,
      specificDays: frequency === 'Weekly' ? specificDays : undefined,
      icon,
      color,
    };
    onUpdateGoal(updatedGoal);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(goal.title);
    setFrequency(goal.frequency);
    setSpecificDays(goal.specificDays || []);
    setIcon(goal.icon);
    setColor(goal.color);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color }}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              {isEditing ? (
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-2xl font-bold h-auto" />
              ) : (
                <span className="text-2xl font-bold">{title}</span>
              )}
            </CardTitle>
            <CardDescription>Manage your goal details and track its progress.</CardDescription>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {isEditing ? (
              <>
                <Button onClick={handleSave}>Save</Button>
                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <Label>Frequency</Label>
          <div className="col-span-2">
            {isEditing ? (
              <Select value={frequency} onValueChange={(value) => setFrequency(value as Goal['frequency'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{frequency}</p>
            )}
          </div>
        </div>

        {frequency === 'Weekly' && (
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
            <Label>Days</Label>
            <div className="col-span-2">
              {isEditing ? (
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  value={specificDays.map(String)}
                  onValueChange={(days) => setSpecificDays(days.map(Number))}
                  className="justify-start"
                >
                  {weekDays.map(day => (
                    <ToggleGroupItem key={day.value} value={String(day.value)} aria-label={day.label}>
                      {day.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ) : (
                <p className="text-sm text-muted-foreground">{specificDays.map(d => weekDays.find(wd => wd.value === d)?.label).join(', ')}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-4">
          <Label className="pt-2">Icon</Label>
          <div className="col-span-2">
            {isEditing ? (
              <IconPicker value={icon} onChange={setIcon} color={color} />
            ) : (
              <p className="text-sm text-muted-foreground">{icon}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <Label>Color</Label>
          <div className="col-span-2">
            {isEditing ? (
              <ColorPicker color={color} setColor={setColor} />
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-end">
         <Button variant="destructive" onClick={() => onDeleteGoal(goal.id)}>Delete Goal</Button>
      </CardFooter>
    </Card>
  );
};

export default GoalDetail;