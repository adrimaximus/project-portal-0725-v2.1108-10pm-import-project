import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { generatePastelColor, getInitials } from '@/lib/utils';
import AvatarCropper from '@/components/settings/AvatarCropper';

interface AvatarUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  storagePath: string;
  name: string;
  email?: string;
}

const AvatarUpload = ({ value, onChange, storagePath, name, email }: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error("File size is too large. Max 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result as string);
    });
    reader.readAsDataURL(file);
    
    event.target.value = '';
  };

  const handleAvatarUpload = async (imageBlob: Blob) => {
    setImageToCrop(null);
    if (!imageBlob) return;

    setIsUploading(true);
    try {
      const fileExt = 'png';
      const filePath = `${storagePath}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, imageBlob, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData.publicUrl) {
        throw new Error("Could not get public URL for avatar.");
      }

      const avatar_url = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
      onChange(avatar_url);
      toast.success("Avatar uploaded successfully.");

    } catch (error: any) {
      toast.error("Failed to upload avatar.", { description: error.message });
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="relative group w-24 h-24">
        <Avatar className="h-24 w-24">
          <AvatarImage src={value || undefined} alt={name} />
          <AvatarFallback style={generatePastelColor(name || email || 'default')} className="text-3xl">
            <UserIcon className="h-10 w-10 text-white" />
          </AvatarFallback>
        </Avatar>
        <label 
            htmlFor="avatar-upload-person" 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
            {isUploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
                <Camera className="h-6 w-6 text-white" />
            )}
            <input 
                id="avatar-upload-person" 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileSelect}
                disabled={isUploading}
            />
        </label>
      </div>
      {imageToCrop && (
        <AvatarCropper
          imageSrc={imageToCrop}
          onCropComplete={handleAvatarUpload}
          onClose={() => setImageToCrop(null)}
        />
      )}
    </>
  );
};

export default AvatarUpload;