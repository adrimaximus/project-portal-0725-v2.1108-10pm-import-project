import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Sparkles, ImageIcon } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { allUsers, User } from '@/data/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getIconComponent, allIcons } from '@/data/icons';
import { colors } from '@/data/colors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AiIconGenerator from "./AiIconGenerator";
import { Label } from '@/components/ui/label';

const goalFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  icon: z.string().min(1, 'An icon is required.'),
  iconUrl: z.string().optional(),
  color: z.string().min(1, 'A color is required.'),
  collaborators: z.array(z.string()).min(1, 'At least one collaborator is required.'),
  type: z.enum(['quantity', 'value', 'frequency']),
  targetQuantity: z.coerce.number().optional(),
  targetValue: z.coerce.number().optional(),
  frequency: z.enum(['Daily', 'Weekly']),
  targetPeriod: z.enum(['Daily', 'Weekly', 'Monthly', 'Yearly']).optional(),
  unit: z.string().optional(),
  tags: z.array(z.any()).optional(),
  specificDays: z.array(z.string()).optional(),
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (values: GoalFormValues) => void;
  onCancel: () => void;
}

export const GoalForm = ({ goal, onSubmit, onCancel }: GoalFormProps) => {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: goal ? {
      ...goal,
      collaborators: goal.collaborators.map(c => c.id),
    } : {
      title: '',
      description: '',
      icon: 'Target',
      color: '#3B82F6',
      collaborators: ['user-1'],
      type: 'quantity',
      frequency: 'Daily',
      tags: [],
      specificDays: [],
    },
  });

  const { watch, setValue } = form;
  const selectedType = watch('type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Increase Monthly Recurring Revenue" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Provide more context for this goal..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Tabs defaultValue="standard" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standard">Standard Icons</TabsTrigger>
                <TabsTrigger value="ai" disabled={!localStorage.getItem("openai_connected")}>
                  <Sparkles className="mr-2 h-4 w-4" /> AI Generator
                </TabsTrigger>
              </TabsList>
              <TabsContent value="standard">
                <div className="space-y-2 pt-4">
                  <Label>Icon</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {allIcons.map((iconName) => {
                      const IconComponent = getIconComponent(iconName);
                      return (
                        <button
                          type="button"
                          key={iconName}
                          onClick={() => {
                            setValue('icon', iconName, { shouldDirty: true });
                            setValue('iconUrl', undefined, { shouldDirty: true });
                          }}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-md border transition-colors",
                            watch('icon') === iconName && !watch('iconUrl') ? "border-primary ring-2 ring-primary" : "border-input"
                          )}
                        >
                          <IconComponent className="h-5 w-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="ai">
                <div className="pt-4">
                  <AiIconGenerator
                    onIconGenerated={(url) => {
                      setValue('iconUrl', url, { shouldDirty: true });
                      setValue('icon', 'ImageIcon', { shouldDirty: true });
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-8 gap-2">
              {colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setValue('color', color, { shouldDirty: true })}
                  className={cn(
                    "h-10 w-10 rounded-md border transition-all",
                    watch('color') === color ? "ring-2 ring-offset-2 ring-primary" : ""
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a goal type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="quantity">Quantity</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="frequency">Frequency</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {selectedType === 'quantity' && 'Track a specific number of items.'}
                {selectedType === 'value' && 'Track a monetary or numerical value.'}
                {selectedType === 'frequency' && 'Track how often an action is completed.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedType === 'quantity' && (
              <FormField
                control={form.control}
                name="targetQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Quantity</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {selectedType === 'value' && (
              <>
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 50000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl><Input placeholder="e.g., $, €, MRR" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {selectedType === 'frequency' && (
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a frequency" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {(selectedType === 'quantity' || selectedType === 'value' || selectedType === 'frequency') && (
              <FormField
                control={form.control}
                name="targetPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a period" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="collaborators"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collaborators</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {field.value?.length > 0
                        ? `${field.value.length} user(s) selected`
                        : "Select collaborators"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {allUsers.map((user: User) => (
                        <CommandItem
                          value={user.name}
                          key={user.id}
                          onSelect={() => {
                            const currentValues = field.value || [];
                            const newValues = currentValues.includes(user.id)
                              ? currentValues.filter((id) => id !== user.id)
                              : [...currentValues, user.id];
                            field.onChange(newValues);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value?.includes(user.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <Avatar className="mr-2 h-6 w-6">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.initials}</AvatarFallback>
                          </Avatar>
                          {user.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {goal ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Form>
  );
};