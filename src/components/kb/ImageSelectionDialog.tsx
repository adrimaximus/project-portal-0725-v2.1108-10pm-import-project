import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, ImageOff } from 'lucide-react';
import { unsplash } from '@/integrations/unsplash/client';
import { Basic } from 'unsplash-js/dist/methods/photos/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface ImageSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleSlug: string;
  searchTerms: string[];
}

const ImageSelectionDialog = ({ open, onOpenChange, articleSlug, searchTerms }: ImageSelectionDialogProps) => {
  const [images, setImages] = useState<Basic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Basic | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const fetchImages = useCallback(async () => {
    if (!unsplash) {
      toast.error("Unsplash client is not configured.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await unsplash.search.getPhotos({
        query: searchTerms.join(' '),
        perPage: 12,
        orientation: 'landscape',
      });
      if (response.type === 'success') {
        setImages(response.response.results);
      } else {
        throw new Error(response.errors.join(', '));
      }
    } catch (error) {
      console.error("Unsplash search failed:", error);
      toast.error("Failed to search for images on Unsplash.");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerms]);

  useEffect(() => {
    if (open) {
      fetchImages();
    }
  }, [open, fetchImages]);

  const handleSave = async () => {
    if (!selectedImage || !user) return;
    setIsSaving(true);
    toast.info("Preparing and uploading image...");
    try {
      const response = await fetch(selectedImage.urls.regular);
      if (!response.ok) throw new Error('Failed to download image from Unsplash.');
      
      const blob = await response.blob();
      const fileName = `${selectedImage.id}-${selectedImage.user.username}.jpeg`;
      const imageFile = new File([blob], fileName, { type: 'image/jpeg' });

      const filePath = `${user.id}/${articleSlug}-${Date.now()}.jpeg`;
      const { error: uploadError } = await supabase.storage.from('kb-images').upload(filePath, imageFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('kb-images').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('kb_articles')
        .update({ header_image_url: urlData.publicUrl })
        .eq('slug', articleSlug);
      if (updateError) throw updateError;

      toast.success("Header image has been set!");
      queryClient.invalidateQueries({ queryKey: ['kb_article', articleSlug] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to set header image.", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a Header Image</DialogTitle>
          <DialogDescription>
            Select an image for your new article based on these suggestions: {searchTerms.join(', ')}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 border rounded-md">
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : images.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-muted-foreground text-center pt-16">
                <ImageOff className="h-8 w-8 mb-2" />
                <p>No images found. You can add one later by editing the page.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {images.map(photo => (
                  <button
                    key={photo.id}
                    type="button"
                    className="aspect-video rounded-md overflow-hidden relative group focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                    onClick={() => setSelectedImage(photo)}
                  >
                    <img
                      src={photo.urls.thumb}
                      alt={photo.alt_description || 'Unsplash photo'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {selectedImage?.id === photo.id && (
                      <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip for now</Button>
          <Button onClick={handleSave} disabled={!selectedImage || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Set Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageSelectionDialog;