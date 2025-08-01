import { AssignedUser } from '@/data/projects';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';

interface TeamSelectorProps {
  users: AssignedUser[];
  selectedUsers: AssignedUser[];
  onSelectionChange: (user: AssignedUser) => void;
}

const TeamSelector = ({ users, selectedUsers, onSelectionChange }: TeamSelectorProps) => {
  return (
    <div className="space-y-2">
      {users.map(user => (
        <div key={user.id} className="flex items-center space-x-2">
          <Checkbox 
            id={`user-${user.id}`}
            checked={selectedUsers.some(su => su.id === user.id)}
            onCheckedChange={() => onSelectionChange(user)}
          />
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <label htmlFor={`user-${user.id}`} className="font-medium">{user.name}</label>
        </div>
      ))}
    </div>
  );
};

export default TeamSelector;