import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, History } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import ActivityIcon from '@/components/project-detail/ActivityIcon';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';

const fetchGlobalActivities = async () => {
  const { data, error } = await supabase.rpc('get_global_project_activities', { p_limit: 20, p_offset: 0 });
  if (error) throw error;
  return data;
};

const GlobalActivityFeed = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['globalActivities'],
    queryFn: fetchGlobalActivities,
  });

  const formatDescription = (text: string) => {
    if (!text) return "";

    let processedText = text
      .replace(/\\"/g, "")
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-card-foreground">$1</strong>')
      .replace(/@\[(.*?)\]\(.*?\)/g, '@$1');

    const attachmentMatch = processedText.match(/(Attachments:.*)/s);

    if (attachmentMatch) {
      const mainDescription = processedText.substring(0, attachmentMatch.index);
      const attachmentBlock = attachmentMatch[0];
      
      const linkRegex = /\[(.*?)\]\((.*?)\)/g;
      let linksHtml = '';
      let match;
      while ((match = linkRegex.exec(attachmentBlock)) !== null) {
        const fileName = match[1];
        const fileUrl = match[2];
        linksHtml += `<a href="${fileUrl}" class="underline" target="_blank" rel="noopener noreferrer">${fileName}</a><br>`;
      }

      if (linksHtml) {
        return `${mainDescription}<br><em class="text-muted-foreground">Attachments:</em><blockquote class="mt-1 border-l-2 pl-4 text-xs">${linksHtml}</blockquote>`;
      }
    }

    return processedText;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <History className="mx-auto h-12 w-12" />
            <p className="mt-4">No recent activity across your projects.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {activities.map((activity: any) => (
              <li key={activity.id} className="flex items-start space-x-4">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={getAvatarUrl(activity.user_avatar_url, activity.user_id)} />
                    <AvatarFallback style={generatePastelColor(activity.user_id)}>
                      {activity.user_initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                    <ActivityIcon type={activity.type} />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground break-words">
                    <span className="font-semibold text-card-foreground">{activity.user_name}</span>
                    {' '}
                    <span dangerouslySetInnerHTML={{ __html: formatDescription(activity.details.description) }} />
                    {' on '}
                    <Link to={`/projects/${activity.project_slug}`} className="font-semibold text-primary hover:underline">
                      {activity.project_name}
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default GlobalActivityFeed;