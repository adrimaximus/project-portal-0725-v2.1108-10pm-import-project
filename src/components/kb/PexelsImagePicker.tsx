import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, CameraOff } from 'lucide-react';
import debounce from 'lodash.debounce';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PexelsImagePickerProps {
  onImageSelect: (url: string) => void;
}

type PexelsPhoto = {
  id: number;
  src: {
    medium: string;
    large: string;
  };
  alt: string;
};

const PexelsImagePicker = ({ onImageSelect }: PexelsImagePickerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState<PexelsPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchImages = async (query: string) => {
    if (!query) {
      setImages([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('pexels-proxy', {
        body: { endpoint: 'search', query, per_page: 12 }
      });

      if (functionError) throw new Error(functionError.message);
      if (data.error) throw new Error(data.error);

      setImages(data.photos || []);
    } catch (err: any) {
      console.error("Error searching Pexels:", err);
      setError("Could not search for images. The Pexels API might not be configured.");
      toast.error("Image search failed.", { description: "Please check your Pexels API key in the settings." });
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(searchImages, 500), []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for an image..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>
      {isLoading && (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="flex flex-col justify-center items-center h-48 text-center text-muted-foreground">
          <CameraOff className="h-8 w-8 mb-2" />
          <p>{error}</p>
        </div>
      )}
      {!isLoading && !error && images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {images.map(image => (
            <button
              key={image.id}
              onClick={() => onImageSelect(image.src.large)}
              className="aspect-square overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <img src={image.src.medium} alt={image.alt} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {!isLoading && !error && images.length === 0 && searchTerm && (
        <div className="text-center text-muted-foreground py-8">
          <p>No results found for "{searchTerm}".</p>
        </div>
      )}
    </div>
  );
};

export default PexelsImagePicker;