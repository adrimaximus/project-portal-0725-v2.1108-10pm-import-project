import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import ModernTeamSelector from "./ModernTeamSelector";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { toast } from "sonner";

const ProjectDetailsForm = () => {
  const { control } = useFormContext();
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, email, avatar_url');
      if (error) {
        toast.error("Failed to fetch users");
      } else {
        const users = data.map((p: any) => {
          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
          return {
            id: p.id,
            name: name || p.email,
            avatar_url: p.avatar_url,
            email: p.email,
            initials: (p.first_name?.[0] || '') + (p.last_name?.[0] || '') || p.email.slice(0, 2).toUpperCase(),
            first_name: p.first_name,
            last_name: p.last_name,
          };
        });
        setAllUsers(users);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., New Website Design" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Provide a brief description of the project"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <DatePicker date={field.value} setDate={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <DatePicker date={field.value} setDate={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="budget"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Budget (Optional)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="e.g., 5000" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="assignedTo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assign Team</FormLabel>
            <FormControl>
              <ModernTeamSelector
                allUsers={allUsers}
                selectedUsers={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ProjectDetailsForm;