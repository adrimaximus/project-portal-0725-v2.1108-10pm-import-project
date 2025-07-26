import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/RichTextEditor';
import { Service } from '@/data/services';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  company: z.string().optional(),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
});

interface ProjectDetailsFormProps {
  selectedServices: Service[];
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}

const ProjectDetailsForm = ({ selectedServices, onSubmit }: ProjectDetailsFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      description: "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
        <p className="text-sm text-muted-foreground">Provide some details about your project.</p>
      </CardHeader>
      <CardContent>
        {selectedServices.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Selected Services</h4>
            <div className="flex flex-wrap gap-2">
              {selectedServices.map((service) => (
                <Badge key={service.id} variant="secondary" className="flex items-center gap-2 p-2">
                   <service.icon className={cn("h-4 w-4", service.iconColor)} />
                   <span className="font-normal">{service.title}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New Marketing Website" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Acme Inc." {...field} />
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
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Describe your project requirements..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Submit Request</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsForm;