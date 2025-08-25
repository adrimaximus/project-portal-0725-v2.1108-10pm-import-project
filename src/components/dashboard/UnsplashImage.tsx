import React, { useEffect, useState, useCallback } from 'react';
import { unsplash } from '@/integrations/unsplash/client';
import { Random } from 'unsplash-js/dist/methods/photos/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CameraOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const UnsplashImage = () => {
  const [photo, setPhoto] = useState<Random | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotoAndCaption = useCallback(async () => {
    if (!unsplash) {
      setError("Unsplash client is not configured. Please check your API key.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await unsplash.photos.getRandom({
        query: 'event',
        orientation: 'landscape',
      });

      if (response.type === 'success') {
        const fetchedPhoto = response.response as Random;
        setPhoto(fetchedPhoto);

        if (fetchedPhoto.alt_description) {
          setCaption(''); // Clear old caption
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const { data, error: captionError } = await supabase.functions.invoke('ai-handler', {
              headers: { Authorization: `Bearer ${session.access_token}` },
              body: { feature: 'generate-caption', payload: { altText: fetchedPhoto.alt_description } },
            });
            if (captionError) throw captionError;
            setCaption(data.caption);
          } catch (captionErr: any) {
            console.warn("Failed to generate AI caption, falling back to default.", captionErr);
            setCaption(`Photo by ${fetchedPhoto.user.name}`);
          }
        } else if (fetchedPhoto.user.name) {
          setCaption(`Photo by ${fetchedPhoto.user.name}`);
        }
      } else {
        throw new Error(response.errors.join(', '));
      }
    } catch (err: any) {
      console.error("Failed to fetch from Unsplash:", err);
      setError("Could not fetch an image from Unsplash. Please check your API key and internet connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotoAndCaption();
    const intervalId = setInterval(fetchPhotoAndCaption, 20000);
    return () => clearInterval(intervalId);
  }, [fetchPhotoAndCaption]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 h-full">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !photo) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
          <CameraOff className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">{error || "Could not load image."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-0 h-full">
        <a href={photo.links.html} target="_blank" rel="noopener noreferrer" className="block group h-full">
          <div className="w-full h-full overflow-hidden relative">
            <img src={photo.urls.regular} alt={photo.alt_description || 'Photo from Unsplash'} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
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

export default UnsplashImage;