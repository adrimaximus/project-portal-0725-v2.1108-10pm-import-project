import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const ImageUploadField = ({ value, onChange }: ImageUploadFieldProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('image_company')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('image_company')
        .getPublicUrl(filePath);
      
      onChange(publicUrl);
      toast.success('Image uploaded successfully.');
    } catch (error: any) {
      toast.error('Image upload failed.', { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group w-32 h-32">
          <img src={value} alt="Uploaded" className="w-full h-full object-cover rounded-md border" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="w-32 h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/50"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8" />
              <span className="text-xs mt-2">Upload Image</span>
            </>
          )}
        </div>
      )}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />
    </div>
  );
};

export default ImageUploadField;