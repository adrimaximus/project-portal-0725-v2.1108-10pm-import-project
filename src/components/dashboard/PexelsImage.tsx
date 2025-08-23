import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '../ui/skeleton';
import { Camera, ExternalLink } from 'lucide-react';

const PexelsImage = () => {
  const [imageData, setImageData] = useState<{ url: string; alt: string; photographer: string; photographer_url: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: functionError } = await supabase.functions.invoke('pexels-proxy', {
          body: { endpoint: 'curated' }
        });

        if (functionError) throw new Error(functionError.message);
        if (data.error) throw new Error(data.error);

        const photo = data.photos?.[0];
        if (photo) {
          setImageData({
            url: photo.src.large,
            alt: photo.alt,
            photographer: photo.photographer,
            photographer_url: photo.photographer_url,
          });
        } else {
          throw new Error("No photo returned from Pexels.");
        }
      } catch (err: any) {
        console.error("Failed to fetch Pexels image:", err);
        setError("Could not load image. The Pexels API might not be configured.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, []);

  if (isLoading) {
    return <Skeleton className="w-full h-48 md:h-64 rounded-lg" />;
  }

  if (error) {
    return (
      <div className="w-full h-48 md:h-64 rounded-lg bg-muted flex flex-col items-center justify-center text-center p-4">
        <Camera className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-muted-foreground">{error}</p>
        <p className="text-xs text-muted-foreground mt-1">Please check your VITE_PEXELS_API_KEY.</p>
      </div>
    );
  }

  if (!imageData) {
    return null;
  }

  return (
    <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden group">
      <img src={imageData.url} alt={imageData.alt} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 text-white">
        <p className="text-sm font-semibold drop-shadow-md">{imageData.alt}</p>
        <a
          href={imageData.photographer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs opacity-80 hover:opacity-100 transition-opacity flex items-center gap-1 group-hover:underline"
        >
          Photo by {imageData.photographer} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

export default PexelsImage;