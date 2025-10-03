import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MultiEmbedItem } from './MultiEmbedCard';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload } from 'lucide-react';
import ImageCropDialog from './ImageCropDialog';

interface MultiEmbedItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MultiEmbedItem | null;
  navItemId: string;
}

const MultiEmbedItemFormDialog: React.FC<MultiEmbedItemFormDialogProps> = ({ open, onOpenChange, item, navItemId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [embedContent, setEmbedContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || '');
      setTags(item.tags?.join(', ') || '');
      setEmbedContent(item.embed_content);
      setImageUrl(item.image_url || null);
    } else {
      setTitle('');
      setDescription('');
      setTags('');
      setEmbedContent('');
      setImageUrl(null);
    }
    setImageFile(null);
    setCropImageSrc(null);
  }, [item, open]);

  const { mutate: upsertItem, isPending } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not found");

      let finalImageUrl = imageUrl;

      if (imageFile) {
        const sanitizedFileName = imageFile.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage.from('multi_embed_images').upload(filePath, imageFile);
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage.from('multi_embed_images').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }

      const dataToUpsert = {
        id: item?.id,
        nav_item_id: navItemId,
        user_id: user.id,
        title,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        embed_content: embedContent,
        image_url: finalImageUrl,
      };

      if (!dataToUpsert.id) {
        delete dataToUpsert.id;
      }

      const { error } = await supabase.from('multi_embed_items').upsert([dataToUpsert]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(item ? 'Item updated' : 'Item created');
      queryClient.invalidateQueries({ queryKey: ['multi_embed_items', navItemId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to save item', { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertItem();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImageSrc(reader.result as string);
        setIsCropDialogOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    const croppedFile = new File([croppedImageBlob], "cropped_image.png", { type: "image/png" });
    setImageFile(croppedFile);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{item ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>Fill in the details for your embed item.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Upload Image</Button>
              {(imageUrl || imageFile) && <img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} alt="Preview" className="mt-2 rounded-md h-64 object-cover aspect-[141/334]" />}
            </div>
            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="tags">Tags (comma-separated)</Label><Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="embed">URL / Embed Code</Label><Textarea id="embed" value={embedContent} onChange={(e) => setEmbedContent(e.target.value)} required /></div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ImageCropDialog
        open={isCropDialogOpen}
        onOpenChange={setIsCropDialogOpen}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={141 / 334}
      />
    </>
  );
};

export default MultiEmbedItemFormDialog;