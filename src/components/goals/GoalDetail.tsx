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

interface GoalDetailProps {
  goal: Goal;
  onUpdate: (goal: Goal) => void;
  onClose?: () => void;
  isCreateMode?: boolean;
}

const GoalDetail = ({ goal, onUpdate, onClose, isCreateMode = false }: GoalDetailProps) => {
  const [editedGoal, setEditedGoal] = useState<Goal>(goal);

  // Helper function to parse frequency string.
  const parseFrequency = (freq: string): { days: string, weeks: number } => {
    const daysMatch = freq.match(/Every (\d+)/);
    const weeksMatch = freq.match(/for (\d+)/);

    let days = "1";
    if (daysMatch) {
      days = daysMatch[1];
    } else if (freq.toLowerCase().includes('week')) {
      days = "7";
    } else if (freq.toLowerCase().includes('daily')) {
      days = "1";
    }

    const weeks = weeksMatch ? parseInt(weeksMatch[1], 10) : 1;

    return { days, weeks };
  };

  const initialFrequency = parseFrequency(goal.frequency);
  const [frequencyValue, setFrequencyValue] = useState<string>(initialFrequency.days);
  const [durationValue, setDurationValue] = useState<number | string>(initialFrequency.weeks);

  const handleSave = () => {
    const finalDays = parseInt(frequencyValue, 10) || 1;

    const numWeeks = typeof durationValue === 'number' ? durationValue : parseInt(durationValue as string, 10);
    const finalWeeks = !isNaN(numWeeks) && numWeeks > 0 ? numWeeks : 1;

    const newFrequencyString = `Every ${finalDays} day${finalDays > 1 ? 's' : ''} for ${finalWeeks} week${finalWeeks > 1 ? 's' : ''}`;
    
    onUpdate({ ...editedGoal, frequency: newFrequencyString });
  };

  const handleIconSelect = (icon: React.ElementType) => {
    setEditedGoal({ ...editedGoal, icon });
  };

  const getIconBackgroundColor = () => {
    const color = editedGoal.color;
    if (color.startsWith('#')) {
      let fullHex = color;
      if (color.length === 4) { // expand shorthand hex #RGB -> #RRGGBB
        fullHex = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
      }
      if (fullHex.length === 7) {
        return `${fullHex}33`; // Append alpha for ~20% opacity
      }
    }
    return 'rgba(128, 128, 128, 0.2)';
  }

  const durNum = parseInt(durationValue.toString(), 10) || 1;

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
        <Label htmlFor="goal-title">Judul Target</Label>
        <Input
          id="goal-title"
          value={editedGoal.title}
          onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
          placeholder="Contoh: Baca 10 halaman"
        />
      </div>
      
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label>Ikon</Label>
          <IconPicker onSelectIcon={handleIconSelect} currentColor={editedGoal.color}>
            <Button variant="outline" className="w-full mt-1 flex items-center justify-between h-10 px-3">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg" style={{ backgroundColor: getIconBackgroundColor() }}>
                  <editedGoal.icon className="h-5 w-5" style={{ color: editedGoal.color }} />
                </div>
                <span className="text-sm">Pilih Ikon</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </IconPicker>
        </div>
        <div>
          <Label>Warna</Label>
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
        <Label htmlFor="frequency">Frekuensi</Label>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={frequencyValue} onValueChange={setFrequencyValue}>
            <SelectTrigger className="flex-1 min-w-[150px]">
              <SelectValue placeholder="Pilih frekuensi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Setiap hari</SelectItem>
              <SelectItem value="2">Setiap 2 hari</SelectItem>
              <SelectItem value="3">Setiap 3 hari</SelectItem>
              <SelectItem value="4">Setiap 4 hari</SelectItem>
              <SelectItem value="5">Setiap 5 hari</SelectItem>
              <SelectItem value="6">Setiap 6 hari</SelectItem>
              <SelectItem value="7">Seminggu sekali</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">selama</span>
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
            {durNum === 1 ? 'minggu' : 'minggu'}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 mt-4 border-t">
        <div>
          {!isCreateMode && (
            <Button variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {onClose && <Button variant="ghost" onClick={onClose}>Batal</Button>}
          <Button onClick={handleSave}>
            {isCreateMode ? 'Buat Target' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoalDetail;