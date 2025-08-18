import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/types';

interface UserMentionProps {
  user: User;
}

const UserMention = ({ user }: UserMentionProps) => {
  return (
    <Link
      to={`/users/${user.id}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 bg-primary/10 text-primary font-semibold rounded-full px-2 py-0.5 mx-0.5 hover:bg-primary/20 transition-colors"
    >
      <Avatar className="h-4 w-4">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
      </Avatar>
      {user.name}
    </Link>
  );
};

export default UserMention;