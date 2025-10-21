import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  storagePath: string;
}

const ImageUpload = ({ value, onChange, storagePath }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${storagePath}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Image upload failed.', { description: uploadError.message });
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from('public-assets')
      .getPublicUrl(filePath);

    onChange(data.publicUrl);
    setIsUploading(false);
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="flex items-center gap-4">
      {value ? (
        <div className="relative group">
          <img src={value} alt="Uploaded image" className="h-20 w-20 rounded-md object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="h-20 w-20 rounded-md border border-dashed flex items-center justify-center bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="relative">
        <Button asChild variant="outline" disabled={isUploading}>
          <label htmlFor="image-upload" className="cursor-pointer">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {value ? 'Change' : 'Upload'}
          </label>
        </Button>
        <Input id="image-upload" type="file" className="sr-only" onChange={handleUpload} accept="image/*" disabled={isUploading} />
      </div>
    </div>
  );
};

export default ImageUpload;