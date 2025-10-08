import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Project, User } from '@/types';

interface AddTeamMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  existingMembers: User[];
}

export const AddTeamMemberDialog = ({ isOpen, onClose, project, existingMembers }: AddTeamMemberDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <p>Add member form will be here.</p>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};