import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import * as z from 'zod';

interface CustomProperty {
  id: string;
  name: string;
  label: string;
  type: string;
  category: string;
  options?: any;
}

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  property: CustomProperty | null;
  category: string;
  onSuccess: () => void;
}

const createPropertySchema = (properties: CustomProperty[], property: CustomProperty | null) => z.object({
  label: z.string().min(1, 'Label is required'),
  type: z.string(),
});

export type PropertyFormValues = z.infer<ReturnType<typeof createPropertySchema>>;

const PropertyFormDialog = ({ open, onOpenChange, property, category, onSuccess }: PropertyFormDialogProps) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('Text');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (property) {
      setLabel(property.label);
      setType(property.type);
    } else {
      setLabel('');
      setType('Text');
    }
  }, [property, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const name = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!name) {
        toast.error("Label must contain alphanumeric characters.");
        setIsSubmitting(false);
        return;
    }

    const propertyData = {
      id: property?.id,
      name,
      label,
      type,
      category,
    };

    const { error } = await supabase.from('custom_properties').upsert(propertyData);

    if (error) {
      toast.error('Failed to save property.');
      console.error('Error saving property:', error);
    } else {
      toast.success(`Property ${property ? 'updated' : 'created'} successfully.`);
      onSuccess();
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  const propertyTypes = ['Text', 'Number', 'Date', 'URL', 'Email', 'Phone', 'Select'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'New Property'}</DialogTitle>
          <DialogDescription>
            {property ? 'Modify the details of your custom property.' : 'Create a new custom field for your records.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Label
              </Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyFormDialog;