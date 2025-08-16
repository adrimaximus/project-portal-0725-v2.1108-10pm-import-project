import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Briefcase, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';

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
  return {
    id: data.id,
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email,
    email: data.email,
    avatar: data.avatar_url,
    initials: `${data.first_name?.[0] || ''}${data.last_name?.[0] || ''}`.toUpperCase() || 'NN',
    role: data.role,
  };
};

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile', id],
    queryFn: () => fetchUserProfile(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-32 mb-8" />
          <Card>
            <CardHeader className="items-center text-center">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-8 w-48 mt-4" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  if (error || !profile) {
    return (
      <PortalLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold">User Not Found</h2>
          <p className="text-muted-foreground">The user you are looking for does not exist.</p>
          <Button asChild variant="link" className="mt-4">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/chat">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chat
          </Link>
        </Button>
        <Card>
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback className="text-3xl">{profile.initials}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{profile.name}</CardTitle>
            <CardDescription>
              <Badge variant="outline" className="capitalize mt-2">{profile.role || 'Member'}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-md">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <a href={`mailto:${profile.email}`} className="text-sm text-primary hover:underline">
                {profile.email}
              </a>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-md">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                View projects this user is on (feature coming soon).
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default UserProfilePage;