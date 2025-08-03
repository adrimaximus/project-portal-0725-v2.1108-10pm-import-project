import { useState, useEffect } from 'react';
import { Goal, GoalType, GoalPeriod, DayOfWeek } from '@/data/goals';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { HexColorPicker } from 'react-colorful';
import { Edit, Plus } from 'lucide-react';

type GoalFormData = Omit<Goal, 'id' | 'completions' | 'collaborators'>;

interface GoalFormDialogProps {
  goal?: Goal;
  onSave: (data: Omit<Goal, 'id' | 'completions'>) => void;
}

export function GoalFormDialog({ goal, onSave }: GoalFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>({
    title: goal?.title || '',
    description: goal?.description || '',
    icon: goal?.icon || 'flag',
    type: goal?.type || 'quantity',
    targetPeriod: goal?.targetPeriod || 'Daily',
    targetQuantity: goal?.targetQuantity || null,
    targetValue: goal?.targetValue || null,
    unit: goal?.unit || null,
    frequency: goal?.frequency || null,
    specificDays: goal?.specificDays || [],
    color: goal?.color || '#3b82f6',
    tags: goal?.tags || [],
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description,
        icon: goal.icon,
        type: goal.type,
        targetPeriod: goal.targetPeriod,
        targetQuantity: goal.targetQuantity,
        targetValue: goal.targetValue,
        unit: goal.unit,
        frequency: goal.frequency,
        specificDays: goal.specificDays,
        color: goal.color,
        tags: goal.tags,
      });
    }
  }, [goal, open]);

  const handleChange = (field: keyof GoalFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumericChange = (field: 'targetQuantity' | 'targetValue' | 'frequency', value: string) => {
    const num = value === '' ? null : parseInt(value.replace(/,/g, ''), 10);
    handleChange(field, isNaN(num!) ? null : num);
  };

  const handleSave = () => {
    onSave({ ...formData, collaborators: goal?.collaborators || ['You'] });
    setOpen(false);
  };

  const goalTypes: GoalType[] = ['quantity', 'value', 'frequency'];
  const periods: GoalPeriod[] = ['Daily', 'Weekly', 'Monthly'];
  const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={goal ? 'ghost' : 'default'} size={goal ? 'icon' : 'default'}>
          {goal ? <Edit className="h-4 w-4" /> : <><Plus className="mr-2 h-4 w-4" /> Add Goal</>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create a New Goal'}</DialogTitle>
          <DialogDescription>
            {goal ? 'Update the details of your goal.' : 'Set up a new goal to track your progress.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Form fields */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={formData.title} onChange={e => handleChange('title', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Select value={formData.type} onValueChange={(v: GoalType) => handleChange('type', v)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                {goalTypes.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {formData.type === 'quantity' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetQuantity" className="text-right">Target</Label>
              <Input id="targetQuantity" type="number" value={formData.targetQuantity || ''} onChange={e => handleNumericChange('targetQuantity', e.target.value)} className="col-span-3" />
            </div>
          )}
          {formData.type === 'value' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetValue" className="text-right">Target</Label>
                <Input id="targetValue" type="number" value={formData.targetValue || ''} onChange={e => handleNumericChange('targetValue', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unit</Label>
                <Input id="unit" value={formData.unit || ''} onChange={e => handleChange('unit', e.target.value)} className="col-span-3" placeholder="e.g., IDR, km" />
              </div>
            </>
          )}
          {formData.type === 'frequency' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">Times/Week</Label>
                <Input id="frequency" type="number" value={formData.frequency || ''} onChange={e => handleNumericChange('frequency', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Days</Label>
                <ToggleGroup type="multiple" value={formData.specificDays || []} onValueChange={(v: DayOfWeek[]) => handleChange('specificDays', v)} className="col-span-3 flex-wrap justify-start">
                  {days.map(day => <ToggleGroupItem key={day} value={day} className="text-xs px-2">{day}</ToggleGroupItem>)}
                </ToggleGroup>
              </div>
            </>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Color</Label>
            <div className="col-span-3">
              <HexColorPicker color={formData.color} onChange={c => handleChange('color', c)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GoalFormDialog;