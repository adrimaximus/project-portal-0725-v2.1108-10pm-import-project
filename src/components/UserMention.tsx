import React from 'react';
import { User } from '@/types';
import { cn } from '@/lib/utils';

interface UserMentionProps {
  user: User;
  className?: string;
}

const UserMention: React.FC<UserMentionProps> = ({ user, className }) => {
  const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;

  return (
    <span className={cn("font-semibold text-primary bg-primary/10 px-1 py-0.5 rounded-sm", className)}>
      @{userName}
    </span>
  );
};

export default UserMention;