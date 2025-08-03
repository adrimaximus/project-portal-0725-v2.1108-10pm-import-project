import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Goal } from "@/data/goals";
import { User } from "@/data/projects";
import { Tag, TagInput } from "../ui/tag-input";

const goalFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  collaborators: z.array(z.string()),
  tags: z.array(z.object({
    id: z.string(),
    text: z.string(),
  })),
});

interface GoalFormProps {
  goal?: Goal;
  users: User[];
  onSubmit: (values: z.infer<typeof goalFormSchema>) => void;
  onCancel: () => void;
}

export function GoalForm({ goal, users, onSubmit, onCancel }: GoalFormProps) {
  const form = useForm<z.infer<typeof goalFormSchema>>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: goal
      ? {
          ...goal,
          collaborators: goal.collaborators.map((c) => c.id),
          tags: goal.tags.map(t => ({ id: t, text: t })),
        }
      : {
          title: "",
          collaborators: [],
          tags: [],
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Ship feature X" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <TagInput
                  {...field}
                  placeholder="Enter a tag"
                  tags={field.value}
                  setTags={(newTags) => {
                    form.setValue("tags", newTags as Tag[]);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Other form fields will be here */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}