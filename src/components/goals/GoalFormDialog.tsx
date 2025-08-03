import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Goal, GoalType, GoalPeriod, dummyGoals } from '@/data/goals';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { formatNumber } from '@/lib/formatting';
import { useSettings } from '@/hooks/useSettings';

const goalFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color.'),
  type: z.enum(['frequency', 'quantity', 'value']),
  frequency: z.enum(['Daily', 'Weekly']).optional(),
  specificDays: z.array(z.string()).optional(),
  targetQuantity: z.number().positive().optional(),
  targetPeriod: z.enum(['Weekly', 'Monthly']).optional(),
  targetValue: z.number().positive().optional(),
  unit: z.string().optional(),
});

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalUpdate: (goal: Goal) => void;
  goal?: Goal | null;
}

const DaySelector = ({ value = [], onChange }: { value?: string[], onChange: (days: string[]) => void }) => {
    const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const toggleDay = (day: string) => {
        const newDays = value.includes(day) ? value.filter(d => d !== day) : [...value, day];
        onChange(newDays.sort((a, b) => days.indexOf(a) - days.indexOf(b)));
    };

    return (
        <div className="flex gap-1">
            {days.map(day => (
                <Button
                    key={day}
                    type="button"
                    variant={value.includes(day) ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => toggleDay(day)}
                    className="w-9 h-9"
                >
                    {day}
                </Button>
            ))}
        </div>
    );
};

const GoalFormDialog = ({ open, onOpenChange, onGoalUpdate, goal }: GoalFormDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { apiKey, isLoaded } = useSettings();
  const isNewGoal = !goal;

  const form = useForm<z.infer<typeof goalFormSchema>>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: '',
      description: '',
      color: '#3B82F6',
      type: 'frequency',
      frequency: 'Daily',
      specificDays: [],
      unit: '',
    },
  });

  const type = form.watch('type');

  useEffect(() => {
    if (goal) {
      form.reset({
        title: goal.title,
        description: goal.description,
        color: goal.color,
        type: goal.type,
        frequency: goal.type === 'frequency' ? goal.frequency : undefined,
        specificDays: goal.type === 'frequency' ? goal.specificDays : undefined,
        targetQuantity: goal.type === 'quantity' ? goal.targetQuantity : undefined,
        targetPeriod: goal.type === 'quantity' ? goal.targetPeriod : undefined,
        targetValue: goal.type === 'value' ? goal.targetValue : undefined,
        unit: goal.type === 'value' ? goal.unit : undefined,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        color: '#3B82F6',
        type: 'frequency',
        frequency: 'Daily',
        specificDays: [],
        unit: '',
        targetQuantity: undefined,
        targetValue: undefined,
      });
    }
  }, [goal, form]);

  const handleNumericInputChange = (field: 'targetQuantity' | 'targetValue', e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitizedValue = rawValue.replace(/,/g, '');
    if (sanitizedValue === '') {
      form.setValue(field, undefined);
      return;
    }
    const numValue = parseInt(sanitizedValue, 10);
    if (!isNaN(numValue)) {
      form.setValue(field, numValue);
    }
  };

  async function onSubmit(values: z.infer<typeof goalFormSchema>) {
    setIsSubmitting(true);
    let icon = goal?.icon || '🎯';

    if (isNewGoal) {
      if (!apiKey) {
        toast.error("API Key not set. Please set it in the Settings page to generate an icon.", {
          action: {
            label: "Go to Settings",
            onClick: () => {
              // This is a bit of a hack, but it works for now
              window.location.href = '/settings';
            },
          },
        });
        setIsSubmitting(false);
        return;
      }
      
      toast.info("Generating an icon with AI...", { duration: 2000 });
      try {
        // Placeholder for real API call
        // In the next step, we will replace this with a call to a Supabase Edge Function
        await new Promise(resolve => setTimeout(resolve, 1500));
        const prompt = `${values.title}, ${values.description || ''}`;
        const keyword = prompt.split(' ').find(word => word.length > 3) || 'goal';
        icon = `https://source.unsplash.com/128x128/?${keyword.toLowerCase()}&sig=${Date.now()}`;
        toast.success("Icon generated!");
      } catch (error) {
        console.error("Icon generation failed:", error);
        toast.error("Could not generate an icon, using a default one.");
      }
    }

    const goalData: Goal = {
      id: goal?.id || new Date().toISOString(),
      title: values.title,
      description: values.description || '',
      color: values.color,
      type: values.type,
      icon: icon,
      frequency: values.type === 'frequency' ? values.frequency! : 'Daily',
      specificDays: values.type === 'frequency' ? values.specificDays! : [],
      targetQuantity: values.type === 'quantity' ? values.targetQuantity : undefined,
      targetPeriod: values.type === 'quantity' ? values.targetPeriod : undefined,
      targetValue: values.type === 'value' ? values.targetValue : undefined,
      unit: values.type === 'value' ? values.unit : undefined,
      tags: goal?.tags || [],
      completions: goal?.completions || [],
      collaborators: goal?.collaborators || [],
    };

    onGoalUpdate(goalData);
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isNewGoal ? 'Create New Goal' : 'Edit Goal'}</DialogTitle>
          <DialogDescription>
            {isNewGoal ? "Set up a new goal to track your progress." : "Make changes to your existing goal."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Read 10 books" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="e.g., A short description of your goal" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>Goal Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="frequency">Frequency</SelectItem>
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem><FormLabel>Color</FormLabel><FormControl><Input type="color" className="p-1 h-10 w-14" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            {type === 'quantity' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="targetQuantity" render={({ field }) => (
                  <FormItem><FormLabel>Target Quantity</FormLabel><FormControl><Input type="text" inputMode="numeric" placeholder="e.g., 300" value={field.value ? formatNumber(field.value) : ''} onChange={(e) => handleNumericInputChange('targetQuantity', e)} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="targetPeriod" render={({ field }) => (
                  <FormItem><FormLabel>Period</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Weekly">Weekly</SelectItem><SelectItem value="Monthly">Monthly</SelectItem></SelectContent>
                  </Select><FormMessage /></FormItem>
                )} />
              </div>
            )}

            {type === 'value' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="targetValue" render={({ field }) => (
                  <FormItem><FormLabel>Target Value</FormLabel><FormControl><Input type="text" inputMode="numeric" placeholder="e.g., 5000000" value={field.value ? formatNumber(field.value) : ''} onChange={(e) => handleNumericInputChange('targetValue', e)} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="e.g., IDR, USD, points" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            )}

            {type === 'frequency' && (
              <FormField control={form.control} name="frequency" render={({ field }) => (
                <FormItem><FormLabel>Frequency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="Daily">Daily</SelectItem><SelectItem value="Weekly">Specific Days</SelectItem></SelectContent>
                </Select><FormMessage /></FormItem>
              )} />
            )}

            {type === 'frequency' && form.watch('frequency') === 'Weekly' && (
              <FormField control={form.control} name="specificDays" render={({ field }) => (
                <FormItem><FormLabel>Specific Days</FormLabel><FormControl><DaySelector value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
              )} />
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !isLoaded}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isNewGoal ? 'Create Goal' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GoalFormDialog;