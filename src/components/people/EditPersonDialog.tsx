"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import AvatarUploader from '@/components/people/AvatarUploader';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Person } from '@/types';

interface EditPersonDialogProps {
  person: Person | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditPersonDialog = ({ person, open, onOpenChange }: EditPersonDialogProps) => {
  const queryClient = useQueryClient();

  const handleAvatarUpload = async (url: string) => {
    if (!person) return;

    const { error } = await supabase
      .from('people')
      .update({ avatar_url: url })
      .eq('id', person.id);

    if (error) {
      throw new Error(error.message);
    }
    
    queryClient.invalidateQueries({ queryKey: ['people'] });
  };

  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {person.full_name}</DialogTitle>
          <DialogDescription>Update this contact's profile picture.</DialogDescription>
        </DialogHeader>
        <div className="py-6 flex justify-center">
          <AvatarUploader
            personId={person.id}
            url={person.avatar_url}
            onUpload={handleAvatarUpload}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPersonDialog;