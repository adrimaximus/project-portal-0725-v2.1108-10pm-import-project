"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { User, Upload, Loader2 } from 'lucide-react';

interface AvatarUploaderProps {
  personId: string;
  url: string | null;
  onUpload: (url: string) => Promise<void>;
}

const AvatarUploader = ({ personId, url, onUpload }: AvatarUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url);

  useEffect(() => {
    setAvatarUrl(url);
  }, [url]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${personId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      if (avatarUrl) {
        const oldFileName = avatarUrl.split('/').pop();
        if (oldFileName) {
          const { error: removeError } = await supabase.storage.from('avatars').remove([oldFileName]);
          if (removeError) {
            console.warn("Could not remove old avatar:", removeError.message);
          }
        }
      }

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(publicUrl);
      await onUpload(publicUrl);
      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32">
        <Avatar className="w-32 h-32 border">
          <AvatarImage src={avatarUrl ?? undefined} alt="Avatar" />
          <AvatarFallback className="bg-secondary">
            <User className="w-16 h-16 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <label
          htmlFor="avatar-upload"
          className="absolute -bottom-2 -right-2 flex items-center justify-center w-10 h-10 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-primary-foreground" />
          )}
        </label>
        <input
          className="hidden"
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  );
};

export default AvatarUploader;