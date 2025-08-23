import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, CameraOff } from 'lucide-react';
import { pexelsClient } from '@/integrations/pexels/client';
import { Photo } from 'pexels';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PexelsImagePickerProps {
  onImageFileSelect: (file: File) => void;
  initialSearchTerm?: string;
}

const PexelsImagePicker = ({ onImageFileSelect, initialSearchTerm }: PexelsImagePickerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await pexelsClient.photos.search({ query, per_page: 15 });
      if ("photos" in response) {
        setResults(response.photos);
      } else {
        throw new Error("Invalid response from Pexels API.");
      }
    } catch (error) {
      console.error("Pexels search failed:", error);
      toast.error("Failed to search for images on Pexels.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      handleSearch(initialSearchTerm);
    }
  }, [initialSearchTerm, handleSearch]);

  const handleSearchClick = () => {
    handleSearch(searchTerm);
  };

  const handleSelectAndPrepare = async (photo: Photo) => {
    setIsUploading(true);
    toast.info("Preparing selected image...");
    try {
      const response = await fetch(photo.src.large2x);
      if (!response.ok) {
        throw new Error('Failed to download image from Pexels.');
      }
      const blob = await response.blob();
      
      const fileName = `${photo.id}-${photo.photographer.toLowerCase().replace(/\s/g, '-')}.jpeg`;
      const imageFile = new File([blob], fileName, { type: 'image/jpeg' });

      onImageFileSelect(imageFile);
      toast.success("Image ready to be uploaded.");

    } catch (error: any) {
      toast.error("Failed to prepare image.", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search for an image..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchClick();
            }
          }}
        />
        <Button type="button" onClick={handleSearchClick} disabled={isLoading || isUploading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="h-64 border rounded-md">
        <div className="p-4 relative">
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && results.length === 0 && (
            <div className="flex flex-col justify-center items-center h-full text-muted-foreground text-center pt-16">
              <CameraOff className="h-8 w-8 mb-2" />
              <p>No images found. Try a different search.</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {results.map(photo => (
              <button
                key={photo.id}
                type="button"
                className="aspect-video rounded-md overflow-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none group"
                onClick={() => handleSelectAndPrepare(photo)}
                disabled={isUploading}
              >
                <img
                  src={photo.src.tiny}
                  alt={photo.alt || 'Pexels photo'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default PexelsImagePicker;