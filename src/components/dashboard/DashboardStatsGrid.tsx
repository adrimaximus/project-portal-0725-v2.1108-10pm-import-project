import React, { useMemo, useState, useEffect } from 'react';
import { Project, User, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, UserStatData } from '@/types';
import StatCard from './StatCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardStatsGridProps {
  projects: Project[];
  isLoading: boolean;
}

const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ projects, isLoading }) => {
  const [viewMode, setViewMode] = useState<'quantity' | 'value'>('quantity');

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalValue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const onTrackProjects = projects.filter(p => p.status === 'On Track').length;
    const atRiskProjects = projects.filter(p => p.status === 'At Risk').length;
    const unpaidValue = projects.filter(p => p.payment_status === 'Unpaid').reduce((sum, p) => sum + (p.budget || 0), 0);

    const ownerStats = projects.reduce((acc, p) => {
      if (p.created_by) {
        const ownerId = p.created_by.id;
        if (!acc[ownerId]) {
          acc[ownerId] = { user: p.created_by, projectCount: 0, totalValue: 0 };
        }
        acc[ownerId].projectCount++;
        acc[ownerId].totalValue += p.budget || 0;
      }
      return acc;
    }, {} as Record<string, UserStatData>);
    const topOwnerByCount = Object.values(ownerStats).sort((a, b) => b.projectCount - a.projectCount)[0] || null;
    const topOwnerByValue = Object.values(ownerStats).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    const collaboratorStats = projects.flatMap(p => p.assignedTo).reduce((acc, user) => {
      if (user) {
        const userId = user.id;
        if (!acc[userId]) {
          acc[userId] = { user, projectCount: 0, totalValue: 0 };
        }
        acc[userId].projectCount++;
        const project = projects.find(p => p.assignedTo.some(u => u.id === userId));
        acc[userId].totalValue += project?.budget || 0;
      }
      return acc;
    }, {} as Record<string, UserStatData>);
    const topCollaboratorByCount = Object.values(collaboratorStats).sort((a, b) => b.projectCount - a.projectCount)[0] || null;
    const topCollaboratorByValue = Object.values(collaboratorStats).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    const pendingProjects = projects.filter(p => p.payment_status === 'Unpaid');
    const pendingStats = pendingProjects.reduce((acc, p) => {
      const user = p.created_by;
      if (user) {
        const userId = user.id;
        if (!acc[userId]) {
          acc[userId] = { user, projectCount: 0, totalValue: 0 };
        }
        acc[userId].projectCount++;
        acc[userId].totalValue += p.budget || 0;
      }
      return acc;
    }, {} as Record<string, UserStatData>);
    const topUserByPendingCount = Object.values(pendingStats).sort((a, b) => b.projectCount - a.projectCount)[0] || null;
    const topUserByPendingValue = Object.values(pendingStats).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    return {
      totalProjects,
      totalValue,
      completedProjects,
      onTrackProjects,
      atRiskProjects,
      unpaidValue,
      topOwnerByCount,
      topOwnerByValue,
      topCollaboratorByCount,
      topCollaboratorByValue,
      topUserByPendingCount,
      topUserByPendingValue,
    };
  }, [projects]);

  const topOwner = viewMode === 'quantity' ? stats.topOwnerByCount : stats.topOwnerByValue;
  const topCollaborator = viewMode === 'quantity' ? stats.topCollaboratorByCount : stats.topCollaboratorByValue;
  const topPendingUser = viewMode === 'quantity' ? stats.topUserByPendingCount : stats.topUserByPendingValue;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={viewMode} onValueChange={(value: 'quantity' | 'value') => setViewMode(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="View by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quantity">View by Quantity</SelectItem>
            <SelectItem value="value">View by Value</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={viewMode === 'quantity' ? "Total Projects" : "Total Project Value"}
          value={viewMode === 'quantity' ? stats.totalProjects : stats.totalValue}
          isCurrency={viewMode === 'value'}
          description="All projects in the system"
          isLoading={isLoading}
        />
        <StatCard
          title="Completed Projects"
          value={stats.completedProjects}
          description={`${Math.round((stats.completedProjects / (stats.totalProjects || 1)) * 100)}% of all projects`}
          isLoading={isLoading}
        />
        <StatCard
          title="At Risk Projects"
          value={stats.atRiskProjects}
          description={`${Math.round((stats.atRiskProjects / (stats.totalProjects || 1)) * 100)}% of all projects`}
          isLoading={isLoading}
        />
        <StatCard
          title="Unpaid Invoices Value"
          value={stats.unpaidValue}
          isCurrency
          description="Total value of all unpaid invoices"
          isLoading={isLoading}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top Project Owner</CardTitle>
          </CardHeader>
          <CardContent>
            {topOwner ? (
              <UserStat
                user={topOwner.user}
                metric={viewMode === 'quantity' ? topOwner.projectCount : topOwner.totalValue}
                metricType={viewMode}
              />
            ) : <p className="text-sm text-muted-foreground">No data available.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Collaborator</CardTitle>
          </CardHeader>
          <CardContent>
            {topCollaborator ? (
              <UserStat
                user={topCollaborator.user}
                metric={viewMode === 'quantity' ? topCollaborator.projectCount : topCollaborator.totalValue}
                metricType={viewMode}
              />
            ) : <p className="text-sm text-muted-foreground">No data available.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top User by Unpaid Value</CardTitle>
          </CardHeader>
          <CardContent>
            {topPendingUser ? (
              <UserStat
                user={topPendingUser.user}
                metric={viewMode === 'quantity' ? topPendingUser.projectCount : topPendingUser.totalValue}
                metricType={viewMode}
              />
            ) : <p className="text-sm text-muted-foreground">No data available.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const UserStat = ({ user, metric, metricType }: { user: User, metric: number, metricType: 'quantity' | 'value' }) => (
  <div className="flex items-center space-x-4">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Avatar className="h-12 w-12">
            <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.name} />
            <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          <p>{user.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <div>
      <p className="text-lg font-semibold">{user.name}</p>
      <p className="text-2xl font-bold">
        {metricType === 'value' ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metric) : metric}
        <span className="text-sm font-normal text-muted-foreground"> {metricType === 'quantity' ? 'projects' : ''}</span>
      </p>
    </div>
  </div>
);

export default DashboardStatsGrid;