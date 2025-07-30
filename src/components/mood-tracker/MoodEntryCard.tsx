import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Image as ImageIcon, StickyNote } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface MoodEntryCardProps {
  note: string;
  onNoteChange: (note: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  image: File | null;
  onImageChange: (image: File | null) => void;
  imageUrl: string | null;
  onImageUrlChange: (url: string | null) => void;
}

const MoodEntryCard = ({
  note, onNoteChange, tags, onTagsChange, image, onImageChange, imageUrl, onImageUrlChange
}: MoodEntryCardProps) => {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      onTagsChange([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      onImageChange(acceptedFiles[0]);
      onImageUrlChange(URL.createObjectURL(acceptedFiles[0]));
    }
  }, [onImageChange, onImageUrlChange]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleRemovePhoto = () => {
    onImageChange(null);
    onImageUrlChange(null);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <StickyNote className="h-5 w-5" />
              <h3 className="font-semibold text-foreground">Note</h3>
            </div>
            <Textarea
              placeholder="Very excited to have met our new puppy!"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              className="h-24"
            />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button variant="outline" onClick={handleAddTag}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="py-1 px-2">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 rounded-full hover:bg-muted-foreground/20">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            {imageUrl ? (
              <div className="relative group">
                <img src={imageUrl} alt="Mood photo" className="rounded-lg w-full max-w-xs object-cover shadow-md" />
                <Button variant="destructive" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleRemovePhoto}>
                  Remove photo
                </Button>
              </div>
            ) : (
              <div {...getRootProps()} className="w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-primary hover:bg-muted">
                <input {...getInputProps()} />
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drop a photo here, or click to select</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodEntryCard;