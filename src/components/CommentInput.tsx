import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Mention, MentionsInput, SuggestionDataItem } from "react-mentions";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";

interface UserSuggestion extends SuggestionDataItem {
  avatar_url: string;
  initials: string;
}

interface CommentInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export default function CommentInput({ onSubmit, isLoading }: CommentInputProps) {
  const [comment, setComment] = useState('');

  const { data: users, isLoading: isLoadingUsers } = useQuery<UserSuggestion[]>({
    queryKey: ['mention-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, email, avatar_url');
      if (error) throw error;
      return data.map(p => {
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return {
          id: p.id,
          display: name || p.email,
          avatar_url: p.avatar_url,
          initials: (name ? (name.split(' ')[0][0] + (name.split(' ').length > 1 ? name.split(' ')[1][0] : '')) : p.email[0]).toUpperCase(),
        };
      });
    },
  });

  const fetchUsers = (query: string, callback: (data: SuggestionDataItem[]) => void) => {
    if (isLoadingUsers || !users) return;
    const filteredUsers = users.filter(user =>
      user.display.toLowerCase().includes(query.toLowerCase())
    );
    callback(filteredUsers);
  };

  const renderUserSuggestion = (suggestion: SuggestionDataItem) => {
    const userSuggestion = suggestion as UserSuggestion;
    return (
      <div className="flex items-center p-2">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={getAvatarUrl(userSuggestion.avatar_url) || undefined} />
          <AvatarFallback style={{ backgroundColor: generatePastelColor(userSuggestion.id) }}>{userSuggestion.initials}</AvatarFallback>
        </Avatar>
        <span>{userSuggestion.display}</span>
      </div>
    );
  };

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment.trim());
      setComment('');
    }
  };

  return (
    <div className="space-y-2">
      <MentionsInput
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment... @ to mention"
        className="mentions"
        classNames={{
          control: 'mentions__control',
          input: 'mentions__input',
          suggestions: 'mentions__suggestions',
        }}
      >
        <Mention
          trigger="@"
          data={fetchUsers}
          renderSuggestion={renderUserSuggestion}
          markup="@[__display__](__id__)"
          className="mentions__mention"
        />
      </MentionsInput>
      <Button onClick={handleSubmit} disabled={isLoading || !comment.trim()}>
        {isLoading ? 'Commenting...' : 'Comment'}
      </Button>
    </div>
  );
}