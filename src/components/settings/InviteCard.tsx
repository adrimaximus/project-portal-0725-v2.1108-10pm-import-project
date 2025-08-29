import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PlusCircle, X } from 'lucide-react';
import { Role } from './RoleManagerDialog';

export type Invite = {
  id: number;
  email: string;
  role: string;
};

interface InviteCardProps {
  roles: Role[];
  onSendInvites: (invites: Invite[]) => void;
  onAddManually: () => void;
  isMasterAdmin: boolean;
}

const InviteCard = ({ roles, onSendInvites, onAddManually, isMasterAdmin }: InviteCardProps) => {
  const [invites, setInvites] = useState<Invite[]>([{ id: Date.now(), email: '', role: 'member' }]);

  const handleInviteChange = (id: number, field: 'email' | 'role', value: string) => {
    setInvites(currentInvites =>
      currentInvites.map(invite =>
        invite.id === id ? { ...invite, [field]: value } : invite
      )
    );
  };

  const addInviteField = () => {
    setInvites(currentInvites => [...currentInvites, { id: Date.now(), email: '', role: 'member' }]);
  };

  const removeInviteField = (id: number) => {
    setInvites(currentInvites => currentInvites.filter(invite => invite.id !== id));
  };

  const handleSend = () => {
    onSendInvites(invites);
    setInvites([{ id: Date.now(), email: '', role: 'member' }]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Invite Team Members</CardTitle>
            <CardDescription>Add your colleagues to collaborate and assign them a role.</CardDescription>
          </div>
          <Button variant="outline" onClick={onAddManually}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Manually
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invites.map((invite) => (
            <div key={invite.id} className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-grow space-y-1.5 w-full">
                <Label htmlFor={`email-${invite.id}`}>Email address</Label>
                <Input id={`email-${invite.id}`} placeholder="name@example.com" value={invite.email} onChange={(e) => handleInviteChange(invite.id, 'email', e.target.value)} />
              </div>
              <div className="space-y-1.5 flex-shrink-0 w-full sm:w-auto">
                <Label htmlFor={`role-${invite.id}`}>Role</Label>
                <Select value={invite.role} onValueChange={(value) => handleInviteChange(invite.id, 'role', value)}>
                  <SelectTrigger id={`role-${invite.id}`} className="w-full sm:w-[220px]"><SelectValue placeholder="Select a role" /></SelectTrigger>
                  <SelectContent>
                    {roles.filter(r => isMasterAdmin || r.name !== 'master admin').map(role => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {invites.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeInviteField(invite.id)} className="flex-shrink-0">
                  <X className="h-4 w-4" /><span className="sr-only">Remove</span>
                </Button>
              )}
            </div>
          ))}
          <Button variant="link" className="p-0 h-auto text-primary" onClick={addInviteField}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add another
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full sm:w-auto" onClick={handleSend}>Send Invites</Button>
      </CardFooter>
    </Card>
  );
};

export default InviteCard;