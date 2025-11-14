import React, { useMemo } from 'react';
import { Project, User, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/types';
import StatCard from '@/components/dashboard/StatCard';
import { DollarSign, ListChecks, CreditCard, Hourglass } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardStatsGridProps {
  projects: Project[];
  viewMode: 'quantity' | 'value';
  canViewValue: boolean;
}

type UserStatData = User & {
  projectCount: number;
  totalValue: number;
  projects: { id: string; name: string }[];
};

const UserStat = ({ user, metric, metricType, canViewValue }: { user: UserStatData | null, metric: number, metricType: 'quantity' | 'value', canViewValue: boolean }) => {
  const animatedMetric = useAnimatedCounter(metric, 750);

  if (!user || metric === 0) {
    return (
      <div className="pt-2">
        <div className="text-2xl font-bold">N/A</div>
        <p className="text-xs text-muted-foreground">No data available</p>
      </div>
    );
  }

  const renderMetric = () => {
    if (metricType === 'value' && !canViewValue) {
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>Restricted</span>
        </div>
      );
    }
    return metricType === 'quantity'
      ? `${new Intl.NumberFormat('id-ID').format(animatedMetric)} project${animatedMetric === 1 ? '' : 's'}`
      : `Rp\u00A0${new Intl.NumberFormat('id-ID').format(animatedMetric)}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 sm:gap-4 pt-2 cursor-pointer">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.name} />
              <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-base sm:text-lg font-bold leading-tight">{user.name}</div>
              <p className="text-xs text-muted-foreground">
                {renderMetric()}
              </p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[350px]">
          <div className="max-h-[200px] overflow-y-auto">
            <p className="text-xs text-muted-foreground">Projects:</p>
            <ul className="list-disc pl-4 text-left text-xs">
              {user.projects.map(p => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const DashboardStatsGrid = ({ projects, viewMode, canViewValue }: DashboardStatsGridProps) => {
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalValue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

    const projectStatusCounts = projects.reduce((acc, p) => {
      if (p.status) {
        acc[p.status] = (acc[p.status] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const projectStatusValues = projects.reduce((acc, p) => {
      if (p.status) {
        acc[p.status] = (acc[p.status] || 0) + (p.budget || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    const paymentStatusCounts = projects.reduce((acc, p) => {
      if (p.payment_status) {
        acc[p.payment_status] = (acc[p.payment_status] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const paymentStatusValues = projects.reduce((acc, p) => {
      if (p.payment_status) {
        acc[p.payment_status] = (acc[p.payment_status] || 0) + (p.budget || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    const mostPendingPaymentProjects = projects.filter(p => 
      p.status === 'Completed' && 
      ['Unpaid', 'Pending', 'Overdue', 'In Process'].includes(p.payment_status)
    );

    const mostPendingPaymentStats = mostPendingPaymentProjects.reduce((acc, p) => {
        if (p.created_by && p.created_by.email !== 'adri@7inked.com') {
            if (!acc[p.created_by.id]) {
                acc[p.created_by.id] = { ...p.created_by, projectCount: 0, totalValue: 0, projects: [] };
            }
            acc[p.created_by.id].projectCount++;
            acc[p.created_by.id].totalValue += p.budget || 0;
            acc[p.created_by.id].projects.push({ id: p.id, name: p.name });
        }
        return acc;
    }, {} as Record<string, UserStatData>);
    
    const topOwnerByPendingCount = Object.values(mostPendingPaymentStats).sort((a, b) => b.projectCount - a.projectCount)[0] || null;
    const topOwnerByPendingValue = Object.values(mostPendingPaymentStats).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    return {
      totalProjects,
      totalValue,
      projectStatusCounts, projectStatusValues,
      paymentStatusCounts, paymentStatusValues,
      topOwnerByPendingCount, topOwnerByPendingValue,
    };
  }, [projects]);

  const topPendingOwner = viewMode === 'quantity' ? stats.topOwnerByPendingCount : stats.topOwnerByPendingValue;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Projects"
        value={stats.totalProjects}
        icon={<ListChecks className="h-4 w-4 text-muted-foreground" />}
        projects={projects.map(p => ({ name: p.name }))}
      />
      <StatCard
        title="Total Project Value"
        value={`Rp\u00A0${new Intl.NumberFormat('id-ID').format(stats.totalValue)}`}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        permission="projects:view_value"
        projects={projects.map(p => ({ name: p.name }))}
      />
      <StatCard
        title="Most Pending Payment"
        icon={<Hourglass className="h-4 w-4 text-muted-foreground" />}
        value={
          <UserStat 
            user={topPendingOwner}
            metric={viewMode === 'quantity' ? topPendingOwner?.projectCount ?? 0 : topPendingOwner?.totalValue ?? 0}
            metricType={viewMode}
            canViewValue={canViewValue}
          />
        }
      />
    </div>
  );
};

export default DashboardStatsGrid;