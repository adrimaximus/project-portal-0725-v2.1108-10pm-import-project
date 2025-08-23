import React, { useEffect, useState } from 'react';
import { pexelsClient } from '@/integrations/pexels/client';
import { Photo } from 'pexels';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CameraOff } from 'lucide-react';

const PexelsImage = () => {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const response = await pexelsClient.photos.curated({ per_page: 1, page: Math.floor(Math.random() * 100) + 1 });
        if ("photos" in response && response.photos.length > 0) {
          setPhoto(response.photos[0]);
        } else {
          throw new Error("No photos returned from Pexels.");
        }
      } catch (err: any) {
        console.error("Failed to fetch from Pexels:", err);
        setError("Could not fetch an image from Pexels. Please check your API key and internet connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhoto();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !photo) {
    return (
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center aspect-video">
          <CameraOff className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">{error || "Could not load image."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block group">
          <div className="aspect-video w-full overflow-hidden relative">
            <img src={photo.src.large} alt={photo.alt || 'Photo from Pexels'} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white text-sm font-medium">Photo by {photo.photographer}</p>
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  );
};

export default PexelsImage;