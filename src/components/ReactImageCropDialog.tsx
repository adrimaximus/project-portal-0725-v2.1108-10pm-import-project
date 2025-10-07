import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ReactImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCropComplete: (blob: Blob) => void;
  aspectRatio?: number;
}

const ReactImageCropDialog: React.FC<ReactImageCropDialogProps> = ({ open, onOpenChange, imageSrc, onCropComplete, aspectRatio }) => {
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(!!aspectRatio);

  useEffect(() => {
    setIsAspectRatioLocked(!!aspectRatio);
  }, [open, aspectRatio]);

  const getCroppedImg = (image: HTMLImageElement, crop: Crop, fileName: string): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return Promise.reject(new Error('Could not get canvas context'));
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        (blob as any).name = fileName;
        resolve(blob);
      }, 'image/png');
    });
  };

  const handleCrop = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      try {
        const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop, 'newFile.png');
        onCropComplete(croppedImageBlob);
        onOpenChange(false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        {imageSrc && (
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              aspect={isAspectRatioLocked ? aspectRatio : undefined}
            >
              <img ref={imgRef} src={imageSrc} alt="Source" style={{ maxHeight: '70vh' }} />
            </ReactCrop>
          </div>
        )}
        <DialogFooter className="sm:justify-between">
          <div className="flex items-center space-x-2">
            {aspectRatio && (
              <>
                <Switch
                  id="aspect-ratio-lock"
                  checked={isAspectRatioLocked}
                  onCheckedChange={setIsAspectRatioLocked}
                />
                <Label htmlFor="aspect-ratio-lock">Lock aspect ratio</Label>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleCrop}>Crop</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReactImageCropDialog;