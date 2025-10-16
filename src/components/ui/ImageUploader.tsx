import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
  value: string | null | undefined;
  onChange: (url: string) => void;
  bucket: string;
  folder?: string;
  label?: string;
}

const ImageUploader = ({ value, onChange, bucket, folder = 'public', label = "Image" }: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const filePath = `${folder}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      const { data } = supabase.storage
        .from(bucket)
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value ? (
        <div className="relative group w-32 h-32">
          <img src={value} alt="Uploaded" className="w-32 h-32 object-cover rounded-md border" />
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
        <div
          {...getRootProps()}
          className={`w-full border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-input'
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">
                {isDragActive ? 'Drop the image here...' : 'Drag & drop an image here, or click to select'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;