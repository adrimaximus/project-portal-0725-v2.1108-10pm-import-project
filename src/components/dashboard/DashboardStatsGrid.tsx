import React, { useMemo, useState } from 'react';
import { Project, User, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/types';
import StatCard from './StatCard';
import UserStatCard from './UserStatCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DashboardStatsGridProps {
  projects: Project[];
}

type UserStatData = {
  user: User;
  projectCount: number;
  totalValue: number;
};

const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ projects }) => {
  const [viewMode, setViewMode] = useState<'quantity' | 'value'>('quantity');

  const totalProjects = projects.length;
  const totalValue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const completedProjects = projects.filter(p => p.status === 'Completed');
  const completedValue = completedProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const onTrackProjects = projects.filter(p => p.status === 'On Track');
  const onTrackValue = onTrackProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const atRiskProjects = projects.filter(p => p.status === 'At Risk');
  const atRiskValue = atRiskProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

  const { topOwner, topCollaborator, topPendingUser } = useMemo(() => {
    const ownerStats = projects.reduce((acc, p) => {
      const ownerId = p.created_by.id;
      if (!acc[ownerId]) {
        acc[ownerId] = { user: p.created_by, projectCount: 0, totalValue: 0 };
      }
      acc[ownerId].projectCount++;
      acc[ownerId].totalValue += p.budget || 0;
      return acc;
    }, {} as Record<string, UserStatData>);

    const topOwnerByCount = Object.values(ownerStats).sort((a, b) => b.projectCount - a.projectCount)[0] || null;
    const topOwnerByValue = Object.values(ownerStats).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    const collaboratorStats = projects.reduce((acc, p) => {
      p.assignedTo.forEach(collaborator => {
        if (collaborator.id !== p.created_by.id) {
          if (!acc[collaborator.id]) {
            acc[collaborator.id] = { user: collaborator, projectCount: 0, totalValue: 0 };
          }
          acc[collaborator.id].projectCount++;
          acc[collaborator.id].totalValue += p.budget || 0;
        }
      });
      return acc;
    }, {} as Record<string, UserStatData>);

    const topCollaboratorByCount = Object.values(collaboratorStats).sort((a, b) => b.projectCount - a.projectCount)[0] || null;
    const topCollaboratorByValue = Object.values(collaboratorStats).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    const pendingProjects = projects.filter(p => p.status === 'Pending');
    const pendingStats = pendingProjects.reduce((acc, p) => {
      const ownerId = p.created_by.id;
      if (!acc[ownerId]) {
        acc[ownerId] = { user: p.created_by, projectCount: 0, totalValue: 0 };
      }
      acc[ownerId].projectCount++;
      acc[ownerId].totalValue += p.budget || 0;
      return acc;
    }, {} as Record<string, UserStatData>);

    const topUserByPendingCount = Object.values(pendingStats).sort((a, b) => b.projectCount - a.projectCount)[0] || null;
    const topUserByPendingValue = Object.values(pendingStats).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    return {
      topOwner: viewMode === 'quantity' ? topOwnerByCount : topOwnerByValue,
      topCollaborator: viewMode === 'quantity' ? topCollaboratorByCount : topCollaboratorByValue,
      topPendingUser: viewMode === 'quantity' ? topUserByPendingCount : topUserByPendingValue,
    };
  }, [projects, viewMode]);

  return (
    <div>
      <div className="flex justify-end mb-4">
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
        <StatCard title="Total Projects" value={viewMode === 'quantity' ? totalProjects : totalValue} mode={viewMode} />
        <StatCard title="Completed" value={viewMode === 'quantity' ? completedProjects.length : completedValue} mode={viewMode} />
        <StatCard title="On Track" value={viewMode === 'quantity' ? onTrackProjects.length : onTrackValue} mode={viewMode} />
        <StatCard title="At Risk" value={viewMode === 'quantity' ? atRiskProjects.length : atRiskValue} mode={viewMode} />
      </div>
      <div className="grid gap-4 mt-4 md:grid-cols-1 lg:grid-cols-3">
        <UserStatCard
          title="Top Project Owner"
          user={topOwner?.user}
          metric={viewMode === 'quantity' ? topOwner?.projectCount ?? 0 : topOwner?.totalValue ?? 0}
          metricType={viewMode}
        />
        <UserStatCard
          title="Top Collaborator"
          user={topCollaborator?.user}
          metric={viewMode === 'quantity' ? topCollaborator?.projectCount ?? 0 : topCollaborator?.totalValue ?? 0}
          metricType={viewMode}
        />
        <UserStatCard
          title="Most Pending Projects"
          user={topPendingUser?.user}
          metric={viewMode === 'quantity' ? topPendingUser?.projectCount ?? 0 : topPendingUser?.totalValue ?? 0}
          metricType={viewMode}
        />
      </div>
    </div>
  );
};

export default DashboardStatsGrid;