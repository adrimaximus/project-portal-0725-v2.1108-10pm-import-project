import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';

const fetchUserProfile = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
  return {
    id: data.id,
    name: fullName || data.email,
    email: data.email,
    avatar_url: getAvatarUrl(data.avatar_url, data.id),
    initials: `${data.first_name?.[0] || ''}${data.last_name?.[0] || ''}`.toUpperCase() || 'NN',
    role: data.role,
  };
};

const AssociatedUserCard = ({ userId }: { userId: string }) => {
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
  });

  if (isLoading || !userProfile) {
    return null;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Portal User</CardTitle></CardHeader>
      <CardContent>
        <Link to={`/users/${userId}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
          <Avatar>
            <AvatarImage src={userProfile.avatar_url} />
            <AvatarFallback style={generatePastelColor(userProfile.id)}>{userProfile.initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{userProfile.name}</p>
            <p className="text-sm text-muted-foreground">{userProfile.role}</p>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export default AssociatedUserCard;