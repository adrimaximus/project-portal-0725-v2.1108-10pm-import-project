import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssignedUser } from "@/data/projects";

// Placeholder component content
const ProjectDetailsForm = () => {
  const { control } = useFormContext();
  
  // This is a placeholder to fix the compile error.
  // The actual implementation might be different.
  const placeholderUser: AssignedUser = {
    id: 'user-1',
    name: 'Placeholder User',
    avatar: '',
    status: 'Offline' // Fixed casing from 'offline'
  };

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="projectName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., E-commerce Platform" {...field} />
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
              <Textarea placeholder="Briefly describe the project..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ProjectDetailsForm;