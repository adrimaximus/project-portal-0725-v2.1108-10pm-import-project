import React, { useEffect, useState, useCallback } from 'react';
import { pexelsClient } from '@/integrations/pexels/client';
import { Photo } from 'pexels';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CameraOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PexelsImage = () => {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotoAndCaption = useCallback(async () => {
    try {
      const response = await pexelsClient.photos.search({ 
        query: 'event', 
        per_page: 1, 
        page: Math.floor(Math.random() * 50) + 1,
        orientation: 'landscape'
      });

      let fetchedPhoto: Photo | null = null;
      if ("photos" in response && response.photos.length > 0) {
        fetchedPhoto = response.photos[0];
        setPhoto(fetchedPhoto);
      } else {
        const curatedResponse = await pexelsClient.photos.curated({ per_page: 1, page: Math.floor(Math.random() * 100) + 1 });
        if ("photos" in curatedResponse && curatedResponse.photos.length > 0) {
          fetchedPhoto = curatedResponse.photos[0];
          setPhoto(fetchedPhoto);
        } else {
          throw new Error("No photos returned from Pexels.");
        }
      }

      if (fetchedPhoto && fetchedPhoto.alt) {
        setCaption(''); // Clear old caption while new one is generating
        try {
          const { data, error: captionError } = await supabase.functions.invoke('openai-generator', {
            body: { feature: 'generate-caption', payload: { altText: fetchedPhoto.alt } },
          });
          if (captionError) throw captionError;
          setCaption(data.caption);
        } catch (captionErr: any) {
          console.warn("Failed to generate AI caption, falling back to default.", captionErr);
          setCaption(`Photo by ${fetchedPhoto.photographer}`);
        }
      } else if (fetchedPhoto) {
          setCaption(`Photo by ${fetchedPhoto.photographer}`);
      }

    } catch (err: any) {
      console.error("Failed to fetch from Pexels:", err);
      setError("Could not fetch an image from Pexels. Please check your API key and internet connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotoAndCaption(); // Fetch image on initial load
    const intervalId = setInterval(fetchPhotoAndCaption, 20000); // Fetch new image every 20 seconds
    return () => clearInterval(intervalId); // Clean up interval on component unmount
  }, [fetchPhotoAndCaption]);

  if (isLoading) {
    return (
      <Card className="hidden md:block h-full">
        <CardContent className="p-4 h-full">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !photo) {
    return (
      <Card className="hidden md:block h-full">
        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
          <CameraOff className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">{error || "Could not load image."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hidden md:block h-full">
      <CardContent className="p-0 h-full">
        <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block group h-full">
          <div className="w-full h-full overflow-hidden relative">
            <img src={photo.src.large} alt={photo.alt || 'Photo from Pexels'} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-end">
              {caption ? (
                <p className="text-white text-sm font-medium line-clamp-2">{caption}</p>
              ) : (
                <Skeleton className="h-4 w-3/4 bg-white/20" />
              )}
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  );
};

export default PexelsImage;