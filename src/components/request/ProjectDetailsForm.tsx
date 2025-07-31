"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { allUsers, User } from "@/data/users"
import TeamSelector from "./TeamSelector"
import ServiceSelector from "./ServiceSelector"
import FileUploader from "./FileUploader"
import { Project, AssignedUser, Service, BriefFile } from "@/data/projects"

const formSchema = z.object({
  projectName: z.string().min(2, "Project name must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  startDate: z.date(),
  deadline: z.date(),
  budget: z.coerce.number().positive("Budget must be a positive number."),
  assignedTo: z.array(z.string()).min(1, "At least one team member must be assigned."),
  services: z.array(z.string()).min(1, "At least one service must be selected."),
  briefFiles: z.array(z.instanceof(File)).optional(),
})

interface ProjectDetailsFormProps {
  onSubmit: (project: Omit<Project, 'id' | 'progress' | 'owner' | 'category' | 'paymentDueDate' | 'tasks' | 'activity'>) => void;
  currentUser: User;
}

export function ProjectDetailsForm({ onSubmit, currentUser }: ProjectDetailsFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      description: "",
      budget: 0,
      assignedTo: [],
      services: [],
      briefFiles: [],
    },
  })

  function handleFormSubmit(values: z.infer<typeof formSchema>) {
    const assignedToUsers: AssignedUser[] = values.assignedTo.map(userId => {
      const user = allUsers.find(u => u.id === userId);
      return user ? { ...user, role: 'Member' } : null;
    }).filter((u): u is AssignedUser => u !== null);

    const services: Service[] = values.services.map(serviceName => ({
      name: serviceName,
      price: 0, // Default price, can be adjusted later
    }));

    const briefFiles: BriefFile[] = (values.briefFiles || []).map(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      let type: 'pdf' | 'doc' | 'img' = 'doc';
      if (extension === 'pdf') {
        type = 'pdf';
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
        type = 'img';
      }
      return {
        name: file.name,
        type: type,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      };
    });

    const newProject = {
      name: values.projectName,
      description: values.description,
      status: 'Requested' as const,
      createdBy: currentUser,
      assignedTo: assignedToUsers,
      startDate: format(values.startDate, "yyyy-MM-dd"),
      deadline: format(values.deadline, "yyyy-MM-dd"),
      budget: values.budget,
      paymentStatus: 'Proposed' as const,
      services: services,
      briefFiles: briefFiles,
      tickets: [],
    };
    onSubmit(newProject);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="projectName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. New Marketing Website" {...field} />
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
                <Textarea
                  placeholder="Provide a detailed description of the project requirements."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Deadline</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g. 5000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign Team</FormLabel>
              <FormControl>
                <TeamSelector selectedUsers={field.value} onSelectUsers={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Services</FormLabel>
              <FormControl>
                <ServiceSelector selectedServices={field.value} onSelectServices={field.onChange} />
              </FormControl>
              <FormDescription>
                Select the services required for this project.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="briefFiles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Brief</FormLabel>
              <FormControl>
                <FileUploader onFilesChange={field.onChange} />
              </FormControl>
              <FormDescription>
                Upload any relevant documents, like briefs, wireframes, or design files.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit Project Request</Button>
      </form>
    </Form>
  )
}