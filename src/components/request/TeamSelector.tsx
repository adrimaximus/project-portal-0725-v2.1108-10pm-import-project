import { AssignedUser } from '@/data/projects';

interface TeamSelectorProps {
  users: AssignedUser[];
  selectedUsers: AssignedUser[];
  onSelectionChange: (users: AssignedUser[]) => void;
}

const TeamSelector = ({ users }: TeamSelectorProps) => {
  return (
    <div>
      <h4>Team Members</h4>
      <ul>
        {users.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    </div>
  );
};

export default TeamSelector;