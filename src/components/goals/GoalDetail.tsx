import { useState, useEffect } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ChevronDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import IconPicker from './IconPicker';
import { Slider } from '@/components/ui/slider';

interface GoalDetailProps {
  goal: Goal;
  onUpdate: (goal: Goal) => void;
  onClose?: () => void;
  isCreateMode?: boolean;
}

const GoalDetail = ({ goal, onUpdate, onClose, isCreateMode = false }: GoalDetailProps) => {
  const [editedGoal, setEditedGoal] = useState<Goal>(goal);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [rgbColor, setRgbColor] = useState({ r: 0, g: 0, b: 0 });

  useEffect(() => {
    if (isColorPickerOpen) {
      const colorStr = editedGoal.color;
      let parsedRgb = { r: 239, g: 68, b: 68 }; // Default to a red color

      if (colorStr.startsWith('rgb')) {
        const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          parsedRgb = { r: parseInt(match[1], 10), g: parseInt(match[2], 10), b: parseInt(match[3], 10) };
        }
      } else if (colorStr.startsWith('#')) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorStr);
        if (result) {
          parsedRgb = {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          };
        }
      }
      setRgbColor(parsedRgb);
    }
  }, [isColorPickerOpen, editedGoal.color]);

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgbColor, [component]: value };
    setRgbColor(newRgb);
    setEditedGoal({ ...editedGoal, color: `rgb(${newRgb.r}, ${newRgb.g}, ${newRgb.b})` });
  };

  const handleSave = () => {
    onUpdate(editedGoal);
  };

  const handleIconSelect = (icon: React.ElementType) => {
    setEditedGoal({ ...editedGoal, icon });
  };

  const getIconBackgroundColor = () => {
    const color = editedGoal.color;
    if (color.startsWith('rgb')) {
      return color.replace(')', ', 0.2)').replace('rgb', 'rgba');
    }
    // Handle hex with alpha
    if (color.startsWith('#') && color.length === 7) {
      return `${color}33`; // Approximation for 20% opacity
    }
    return color;
  }

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
          <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full mt-1 justify-start px-2 h-10">
                <div className="w-5 h-5 rounded-full mr-2 border" style={{ backgroundColor: editedGoal.color }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="r-slider" className="text-red-500">Red</Label>
                    <span className="text-sm font-medium w-12 text-center border rounded-md px-2 py-0.5">{rgbColor.r}</span>
                  </div>
                  <Slider
                    id="r-slider"
                    value={[rgbColor.r]}
                    onValueChange={([r]) => handleRgbChange('r', r)}
                    max={255}
                    step={1}
                    className="[&>span:first-child]:bg-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="g-slider" className="text-green-500">Green</Label>
                    <span className="text-sm font-medium w-12 text-center border rounded-md px-2 py-0.5">{rgbColor.g}</span>
                  </div>
                  <Slider
                    id="g-slider"
                    value={[rgbColor.g]}
                    onValueChange={([g]) => handleRgbChange('g', g)}
                    max={255}
                    step={1}
                    className="[&>span:first-child]:bg-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="b-slider" className="text-blue-500">Blue</Label>
                    <span className="text-sm font-medium w-12 text-center border rounded-md px-2 py-0.5">{rgbColor.b}</span>
                  </div>
                  <Slider
                    id="b-slider"
                    value={[rgbColor.b]}
                    onValueChange={([b]) => handleRgbChange('b', b)}
                    max={255}
                    step={1}
                    className="[&>span:first-child]:bg-blue-500"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="frequency">Frequency</Label>
        <Select
          value={editedGoal.frequency}
          onValueChange={(value) => setEditedGoal({ ...editedGoal, frequency: value })}
        >
          <SelectTrigger id="frequency">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Everyday">Everyday</SelectItem>
            <SelectItem value="5 days per week">5 days per week</SelectItem>
            <SelectItem value="3 days per week">3 days per week</SelectItem>
            <SelectItem value="Once a week">Once a week</SelectItem>
          </SelectContent>
        </Select>
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