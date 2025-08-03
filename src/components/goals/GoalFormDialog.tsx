import { useState, useEffect } from "react";
import { Goal, GoalType, GoalPeriod, GoalFrequency } from "@/data/goals";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, TagInput } from "../ui/tag-input";
import { DayOfWeekPicker } from "./DayOfWeekPicker";

interface GoalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id' | 'completions' | 'collaborators'> | Goal) => void;
  goal?: Goal;
}

export function GoalFormDialog({ isOpen, onClose, onSave, goal }: GoalFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GoalType>('quantity');
  const [frequency, setFrequency] = useState<GoalFrequency>('Daily');
  const [specificDays, setSpecificDays] = useState<string[]>([]);
  const [targetQuantity, setTargetQuantity] = useState<number | undefined>();
  const [targetPeriod, setTargetPeriod] = useState<GoalPeriod>('Weekly');
  const [targetValue, setTargetValue] = useState<number | undefined>();
  const [unit, setUnit] = useState("");
  const [color, setColor] = useState("#4A90E2");
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || "");
      setType(goal.type);
      setFrequency(goal.frequency || 'Daily');
      setSpecificDays(goal.specificDays?.map(String) || []);
      setTargetQuantity(goal.targetQuantity);
      setTargetPeriod(goal.targetPeriod);
      setTargetValue(goal.targetValue);
      setUnit(goal.unit || "");
      setColor(goal.color);
      setTags(goal.tags.map(t => ({ id: t, text: t })));
    } else {
      // Reset form
      setTitle("");
      setDescription("");
      setType('quantity');
      setFrequency('Daily');
      setSpecificDays([]);
      setTargetQuantity(undefined);
      setTargetPeriod('Weekly');
      setTargetValue(undefined);
      setUnit("");
      setColor("#4A90E2");
      setTags([]);
    }
  }, [goal, isOpen]);

  const handleSave = () => {
    const baseGoalData = {
      title,
      description,
      type,
      targetPeriod,
      color,
      icon: 'Target', // Placeholder
      tags: tags.map(tag => tag.text),
      targetDate: new Date().toISOString(), // Placeholder
      status: 'On Track' as const, // Placeholder
    };

    if (goal) {
      onSave({
        ...goal,
        ...baseGoalData,
        targetQuantity,
        targetValue,
        unit,
        frequency,
        specificDays: specificDays.map(Number),
      });
    } else {
      onSave({
        ...baseGoalData,
        targetQuantity,
        targetValue,
        unit,
        frequency,
        specificDays: specificDays.map(Number),
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input placeholder="Goal Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Select value={type} onValueChange={(v: GoalType) => setType(v)}>
            <SelectTrigger><SelectValue placeholder="Goal Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="quantity">Quantity</SelectItem>
              <SelectItem value="value">Value</SelectItem>
              <SelectItem value="frequency">Frequency</SelectItem>
            </SelectContent>
          </Select>
          {type === 'frequency' && (
            <>
              <Select value={frequency} onValueChange={(v: GoalFrequency) => setFrequency(v)}>
                <SelectTrigger><SelectValue placeholder="Frequency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              {frequency === 'Weekly' && (
                <DayOfWeekPicker selectedDays={specificDays} onSelectedDaysChange={setSpecificDays} />
              )}
            </>
          )}
          <TagInput
            placeholder="Enter tags..."
            tags={tags}
            setTags={setTags}
          />
        </div>
        <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Goal</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}