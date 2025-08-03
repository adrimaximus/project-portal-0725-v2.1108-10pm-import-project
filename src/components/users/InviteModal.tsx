import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, X } from "lucide-react";
import { UserRole } from '@/data/users';

interface Invite {
  email: string;
  role: UserRole;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const roles: UserRole[] = ['Owner', 'Admin', 'User', 'Read only'];

export const InviteModal = ({ isOpen, onClose }: InviteModalProps) => {
  const [invites, setInvites] = useState<Invite[]>([{ email: '', role: 'User' }]);

  const handleAddAnother = () => {
    setInvites([...invites, { email: '', role: 'User' }]);
  };

  const handleRemoveInvite = (index: number) => {
    if (invites.length > 1) {
      setInvites(invites.filter((_, i) => i !== index));
    }
  };

  const handleInviteChange = (index: number, field: keyof Invite, value: string) => {
    const newInvites = [...invites];
    newInvites[index][field] = value as UserRole;
    setInvites(newInvites);
  };

  const handleSendInvites = () => {
    console.log('Sending invites:', invites);
    onClose();
    setInvites([{ email: '', role: 'User' }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Invite your team members</DialogTitle>
          <p className="text-sm text-muted-foreground">Add your colleagues to Lantern and assign them a role.</p>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {invites.map((invite, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="name@example.com"
                value={invite.email}
                onChange={(e) => handleInviteChange(index, 'email', e.target.value)}
                className="flex-grow"
              />
              <Select
                value={invite.role}
                onValueChange={(value) => handleInviteChange(index, 'role', value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>
              {invites.length > 1 && (
                 <Button variant="ghost" size="icon" onClick={() => handleRemoveInvite(index)}>
                    <X className="h-4 w-4" />
                 </Button>
              )}
            </div>
          ))}
          <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleAddAnother}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add another
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSendInvites}>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};