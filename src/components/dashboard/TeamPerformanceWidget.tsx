import { useMemo } from 'react';
import { Project, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, TrendingUp, Lock } from 'lucide-react';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';

interface TeamPerformanceWidgetProps {
  projects: Project[];
  metricType: 'quantity' | 'value';
  canViewValue: boolean;
}

type CollaboratorStat = User & {
  projectCount: number;
  totalValue: number;
};

const TeamPerformanceWidget = ({ projects, metricType, canViewValue }: TeamPerformanceWidgetProps) => {
  const topCollaborators = useMemo(() => {
    const collaboratorStats = projects.reduce((acc, p) => {
      p.assignedTo.forEach(user => {
        if (user.email === 'adri@7inked.com') return;
        if (!acc[user.id]) {
          acc[user.id] = { ...user, projectCount: 0, totalValue: 0 };
        }
        acc[user.id].projectCount++;
        acc[user.id].totalValue += p.budget || 0;
      });
      return acc;
    }, {} as Record<string, CollaboratorStat>);

    const sorted = Object.values(collaboratorStats).sort((a, b) => {
      if (metricType === 'value') {
        return b.totalValue - a.totalValue;
      }
      return b.projectCount - a.projectCount;
    });

    return sorted.slice(0, 3);
  }, [projects, metricType]);

  const renderMetric = (collaborator: CollaboratorStat) => {
    if (metricType === 'value' && !canViewValue) {
      return <div className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /><span>Restricted</span></div>;
    }
    const value = metricType === 'quantity' ? collaborator.projectCount : collaborator.totalValue;
    const unit = metricType === 'quantity' ? (value === 1 ? ' project' : ' projects') : '';
    const prefix = metricType === 'value' ? 'Rp ' : '';
    return `${prefix}${new Intl.NumberFormat('id-ID').format(value)}${unit}`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Team Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topCollaborators.length > 0 ? (
          <ul className="space-y-4">
            {topCollaborators.map((collaborator, index) => (
              <li key={collaborator.id} className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getAvatarUrl(collaborator.avatar_url, collaborator.id)} alt={collaborator.name} />
                    <AvatarFallback style={generatePastelColor(collaborator.id)}>{collaborator.initials}</AvatarFallback>
                  </Avatar>
                  {index === 0 && (
                    <Crown className="absolute -top-2 -left-2 h-4 w-4 text-yellow-500 fill-yellow-400 transform -rotate-12" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{collaborator.name}</p>
                  <p className="text-sm text-muted-foreground">{renderMetric(collaborator)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No team activity to display.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceWidget;