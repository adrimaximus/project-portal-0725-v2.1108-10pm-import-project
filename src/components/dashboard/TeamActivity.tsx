import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "../ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";

const fetchTeamActivity = async () => {
  const { data, error } = await supabase
    .from('project_activities')
    .select(`
      id,
      type,
      details,
      created_at,
      projects (name, slug),
      profiles (id, first_name, last_name, email, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw new Error(error.message);
  return data;
};

const TeamActivity = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['teamActivity'],
    queryFn: fetchTeamActivity,
  });

  const renderActivity = (activity: any) => {
    const user = activity.profiles;
    const project = activity.projects;
    const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Someone';
    const userInitials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.trim() || user.email?.[0].toUpperCase() || 'S' : 'S';

    return (
      <div key={activity.id} className="flex items-start space-x-4">
        <Avatar className="h-9 w-9">
          <AvatarImage src={getAvatarUrl(user?.avatar_url, user?.id)} />
          <AvatarFallback style={generatePastelColor(user?.id)}>
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">{userName}</span>
            {' '}{activity.details?.description || `performed an action`}
            {project && (
              <>
                {' in project '}
                <Link to={`/projects/${project.slug}`} className="font-medium text-primary hover:underline">
                  {project.name}
                </Link>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Activity</CardTitle>
        <CardDescription>Recent activities from your team members.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && [...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
        {activities && activities.length > 0 ? (
          activities.map(renderActivity)
        ) : (
          !isLoading && <p className="text-sm text-muted-foreground text-center">No recent activity.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamActivity;