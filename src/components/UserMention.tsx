import { useNavigate } from 'react-router-dom';
import { User } from '@/types';

interface UserMentionProps {
  user: User;
}

const UserMention = ({ user }: UserMentionProps) => {
  const navigate = useNavigate();

  const handleMentionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/chat', { 
      state: { 
        selectedCollaborator: user 
      } 
    });
  };

  return (
    <a
      href={`/users/${user.id}`}
      onClick={handleMentionClick}
      className="text-primary font-semibold hover:underline"
    >
      @{user.name}
    </a>
  );
};

export default UserMention;