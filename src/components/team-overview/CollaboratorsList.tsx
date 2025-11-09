import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CollaboratorStat {
  id: string;
  name: string;
  initials: string;
  avatar_url: string;
  role: string;
  slug: string | null;
  project_count: number;
  active_task_count: number;
  active_ticket_count: number;
  overdue_bill_count: number;
}

const fetchCollaboratorStats = async (): Promise<CollaboratorStat[]> => {
  const { data, error } = await supabase.rpc('get_collaborator_stats');
  if (error) {
    console.error("Error fetching collaborator stats:", error);
    throw new Error(error.message);
  }
  return data as CollaboratorStat[];
};

const CollaboratorsList = () => {
  const { onlineCollaborators } = useAuth();
  const { data: collaboratorStats = [], isLoading } = useQuery<CollaboratorStat[]>({
    queryKey: ['collaboratorStats'],
    queryFn: fetchCollaboratorStats,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collaboratorStats.map(stat => {
        const onlineInfo = onlineCollaborators.find(c => c.id === stat.id);
        const cardContent = (
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Projects</span> <span className="font-semibold">{stat.project_count}</span></div>
            <div className="flex justify-between"><span>Active Tasks</span> <span className="font-semibold">{stat.active_task_count}</span></div>
            <div className="flex justify-between"><span>Active Tickets</span> <span className="font-semibold">{stat.active_ticket_count}</span></div>
            <div className="flex justify-between"><span>Overdue Bills</span> <span className="font-semibold">{stat.overdue_bill_count}</span></div>
          </CardContent>
        );

        const cardHeader = (
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={getAvatarUrl(stat.avatar_url, stat.id)} />
                <AvatarFallback style={generatePastelColor(stat.id)}>{stat.initials}</AvatarFallback>
              </Avatar>
              {onlineInfo && (
                <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-card ${onlineInfo.isIdle ? 'bg-orange-400' : 'bg-green-500'}`} />
              )}
            </div>
            <div>
              <CardTitle>{stat.name}</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">{stat.role}</p>
            </div>
          </CardHeader>
        );

        if (stat.slug) {
          return (
            <Link to={`/people/${stat.slug}`} key={stat.id}>
              <Card className="hover:shadow-md transition-shadow">
                {cardHeader}
                {cardContent}
              </Card>
            </Link>
          );
        }

        return (
          <Card key={stat.id}>
            {cardHeader}
            {cardContent}
          </Card>
        );
      })}
    </div>
  );
};

export default CollaboratorsList;