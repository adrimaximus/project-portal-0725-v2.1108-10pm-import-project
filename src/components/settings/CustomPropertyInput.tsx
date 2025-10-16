import { useState } from 'react';
import { Control, useController } from 'react-hook-form';
import { CompanyProperty } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CustomPropertyInputProps {
  property: CompanyProperty;
  control: Control<any>;
  name: string;
}

const ImageUploader = ({ value, onChange }: { value: string; onChange: (url: string) => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const filePath = `public/company-logos/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error('Could not get public URL.');
      }

      onChange(data.publicUrl);
      toast({
        title: 'Success',
        description: 'Image uploaded successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'There was a problem with the upload.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group w-32 h-32">
          <img src={value} alt="Uploaded logo" className="w-32 h-32 object-cover rounded-md border" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="w-full border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center text-center">
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <Label htmlFor="image-upload" className="mt-2 text-sm font-medium text-primary hover:underline cursor-pointer">
                Click to upload an image
              </Label>
              <Input id="image-upload" type="file" className="hidden" onChange={handleUpload} accept="image/*" />
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const CustomPropertyInput = ({ property, control, name }: CustomPropertyInputProps) => {
  const { field } = useController({ name, control });

  const renderInput = () => {
    switch (property.type) {
      case 'text':
      case 'number':
      case 'email':
      case 'phone':
      case 'url':
        return <Input type={property.type} {...field} value={field.value || ''} />;
      case 'textarea':
        return <Textarea {...field} value={field.value || ''} />;
      case 'date':
        return <Input type="date" {...field} value={field.value || ''} />;
      case 'select':
        return (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger><SelectValue placeholder={`Select a ${property.label}`} /></SelectTrigger>
            <SelectContent>
              {property.options?.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'image':
        return <ImageUploader value={field.value} onChange={field.onChange} />;
      default:
        return <Input type="text" {...field} value={field.value || ''} />;
    }
  };

  return (
    <div>
      <Label htmlFor={name}>{property.label}</Label>
      <div className="mt-1">
        {renderInput()}
      </div>
    </div>
  );
};

export default CustomPropertyInput;