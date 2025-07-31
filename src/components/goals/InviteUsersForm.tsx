import { dummyUsers, User } from '@/data/users';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface InviteUsersFormProps {
  goal: Goal;
  onInvite: (user: User) => void;
  onClose: () => void;
}

const InviteUsersForm = ({ goal, onInvite, onClose }: InviteUsersFormProps) => {
  const invitedUserIds = new Set(goal.invitedUsers?.map(u => u.id) || []);
  const usersToInvite = dummyUsers.filter(u => !invitedUserIds.has(u.id));

  const handleInvite = (user: User) => {
    onInvite(user);
  };

  return (
    <div className="space-y-4 mt-4">
      {usersToInvite.length > 0 ? (
        <ul className="space-y-3 max-h-60 overflow-y-auto">
          {usersToInvite.map(user => (
            <li key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.name}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleInvite(user)}>Invite</Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">All available users have been invited.</p>
      )}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
};

export default InviteUsersForm;