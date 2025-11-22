import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Service } from '@/types';
import { toast } from "sonner";
import ColorThemePicker from './ColorThemePicker';
import IconPicker from '../IconPicker';
import { Sparkles, Loader2 } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const serviceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().min(1, "Icon is required"),
  icon_color: z.string().min(1, "Color is required"),
  is_featured: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (service: Service) => void;
  service: Service | null;
}

const ServiceFormDialog = ({ open, onOpenChange, onSuccess, service }: ServiceFormDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: 'Package',
      icon_color: 'bg-gray-100 text-gray-600',
      is_featured: false,
    }
  });

  useEffect(() => {
    if (open) {
      if (service) {
        form.reset({
          title: service.title,
          description: service.description,
          icon: service.icon,
          icon_color: service.icon_color,
          is_featured: service.is_featured,
        });
      } else {
        form.reset({
          title: '',
          description: '',
          icon: 'Package',
          icon_color: 'bg-gray-100 text-gray-600',
          is_featured: false,
        });
      }
    }
  }, [service, open, form]);

  const handleGenerateDetails = async () => {
    const title = form.getValues('title');
    if (!title) {
      toast.info("Please enter a title first to generate details.");
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-service-details', {
        body: { title },
      });

      if (error) throw error;

      if (data.description && data.icon && data.icon_color) {
        form.setValue('description', data.description, { shouldValidate: true });
        form.setValue('icon', data.icon, { shouldValidate: true });
        form.setValue('icon_color', data.icon_color, { shouldValidate: true });
        toast.success("Details generated successfully!");
      } else {
        throw new Error("AI did not return all required details.");
      }
    } catch (error: any) {
      toast.error("Failed to generate details.", { description: error.message });
      console.error("Error generating details:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true);

    let data: Service | null = null;
    let error;

    if (service) {
      const { data: updateData, error: updateError } = await supabase.from('services').update(values).eq('id', service.id).select().single();
      data = updateData;
      error = updateError;
    } else {
      const { data: insertData, error: insertError } = await supabase.from('services').insert(values).select().single();
      data = insertData;
      error = insertError;
    }

    if (error) {
      toast.error(`Failed to ${service ? 'update' : 'create'} service.`);
      console.error(error);
    } else if (data) {
      toast.success(`Service ${service ? 'updated' : 'created'} successfully.`);
      onSuccess(data);
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{service ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          <DialogDescription>
            {service ? 'Update the details of the service.' : 'Fill in the details for the new service.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <div className="flex justify-between items-center">
                    <FormLabel>Description</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateDetails}
                      disabled={isGenerating || !form.watch('title')}
                      aria-label="Generate description with AI"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <IconPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <ColorThemePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Featured</FormLabel>
                    <FormDescription>
                      Display this service prominently.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceFormDialog;