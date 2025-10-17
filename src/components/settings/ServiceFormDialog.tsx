import { useState, useEffect } from 'react';
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Service } from '@/types';
import { toast } from "sonner";
import ColorThemePicker from './ColorThemePicker';
import IconPicker from '../IconPicker';

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (service: Service) => void;
  service: Service | null;
}

const ServiceFormDialog = ({ open, onOpenChange, onSuccess, service }: ServiceFormDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [iconColor, setIconColor] = useState('bg-gray-100 text-gray-600');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (service) {
      setTitle(service.title);
      setDescription(service.description);
      setIcon(service.icon);
      setIconColor(service.icon_color);
      setIsFeatured(service.is_featured);
    } else {
      setTitle('');
      setDescription('');
      setIcon('');
      setIconColor('bg-gray-100 text-gray-600');
      setIsFeatured(false);
    }
  }, [service, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const serviceData = {
      title,
      description,
      icon,
      icon_color: iconColor,
      is_featured: isFeatured,
    };

    let data: Service | null = null;
    let error;

    if (service) {
      // Update
      const { data: updateData, error: updateError } = await supabase.from('services').update(serviceData).eq('id', service.id).select().single();
      data = updateData;
      error = updateError;
    } else {
      // Insert
      const { data: insertData, error: insertError } = await supabase.from('services').insert(serviceData).select().single();
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
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                Icon
              </Label>
              <div className="col-span-3">
                <IconPicker value={icon} onChange={setIcon} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Color
              </Label>
              <div className="col-span-3">
                <ColorThemePicker value={iconColor} onChange={setIconColor} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is-featured" className="text-right">
                Featured
              </Label>
              <Switch id="is-featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceFormDialog;