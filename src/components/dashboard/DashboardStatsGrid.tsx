import React, { useMemo, useState } from 'react';
import { Project, User, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/types';
import StatCard from './StatCard';
import { DollarSign, ListChecks, CreditCard, User as UserIcon, Users, Hourglass, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { generatePastelColor } from '@/lib/utils';

interface DashboardStatsGridProps {
  projects: Project[];
}

type UserStatData = User & { projectCount: number; totalValue: number };

const UserStat = ({ user, metric, metricType }: { user: UserStatData | null, metric: number, metricType: 'quantity' | 'value' }) => {
  if (!user || metric === 0) {
    return (
      <div className="pt-2">
        <div className="text-2xl font-bold">N/A</div>
        <p className="text-xs text-muted-foreground">No data available</p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 sm:gap-4 pt-2">
      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
        <AvatarImage src={user.avatar_url} alt={user.name} />
        <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
      </Avatar>
      <div>
        <div className="text-base sm:text-lg font-bold leading-tight">{user.name}</div>
        <p className="text-xs text-muted-foreground">
          {metricType === 'quantity'
            ? `${metric} project${metric === 1 ? '' : 's'}`
            : `Rp\u00A0${new Intl.NumberFormat('id-ID').format(metric)}`}
        </p>
      </div>
    </div>
  );
};

const DashboardStatsGrid = ({ projects }: DashboardStatsGridProps) => {
  const [viewMode, setViewMode] = useState<'quantity' | 'value'>('quantity');

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

    const ownerStats = projects.reduce((acc, p) => {
        if (p.created_by) {
            if (!acc[p.created_by.id]) acc[p.created_by.id] = { ...p.created_by, projectCount: 0, totalValue: 0 };
            acc[p.created_by.id].projectCount++;
            acc[p.created_by.id].totalValue += p.budget || 0;
        }
        return acc;
    }, {} as Record<string, UserStatData>);
    const topOwnerByCount = Object.values(ownerStats).sort((a, b) => b.projectCount - a.projectCount)[0] || null;
    const topOwnerByValue = Object.values(ownerStats).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    const collaboratorStats = projects.reduce((acc, p) => {
        p.assignedTo.forEach(user => {
            if (!acc[user.id]) acc[user.id] = { ...user, projectCount: 0, totalValue: 0 };
            acc[user.id].projectCount++;
            acc[user.id].totalValue += p.budget || 0;
        });
        return acc;
    }, {} as Record<string, UserStatData>);
    const topCollaboratorByCount = Object.values(collaboratorStats).sort((a, b) => b.projectCount - a.projectCount)[0] || null;
    const topCollaboratorByValue = Object.values(collaboratorStats).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    const pendingProjects = projects.filter(p => p.payment_status === 'Pending');
    const pendingStats = pendingProjects.reduce((acc, p) => {
        p.assignedTo.forEach(user => {
            if (!acc[user.id]) acc[user.id] = { ...user, projectCount: 0, totalValue: 0 };
            acc[user.id].projectCount++;
            acc[user.id].totalValue += p.budget || 0;
        });
        return acc;
    }, {} as Record<string, UserStatData>);
    const topUserByPendingCount = Object.values(pendingStats).sort((a, b) => b.projectCount - a.projectCount)[0] || null;
    const topUserByPendingValue = Object.values(pendingStats).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    return {
      totalProjects,
      totalValue,
      projectStatusCounts, projectStatusValues,
      paymentStatusCounts, paymentStatusValues,
      topOwnerByCount, topOwnerByValue,
      topCollaboratorByCount, topCollaboratorByValue,
      topUserByPendingCount, topUserByPendingValue,
    };
  }, [projects]);

  const topOwner = viewMode === 'quantity' ? stats.topOwnerByCount : stats.topOwnerByValue;
  const topCollaborator = viewMode === 'quantity' ? stats.topCollaboratorByCount : stats.topCollaboratorByValue;
  const topPendingUser = viewMode === 'quantity' ? stats.topUserByPendingCount : stats.topUserByPendingValue;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value) => { if (value) setViewMode(value as 'quantity' | 'value')}}
          className="h-8"
        >
          <ToggleGroupItem value="quantity" className="text-xs px-3">By Quantity</ToggleGroupItem>
          <ToggleGroupItem value="value" className="text-xs px-3">By Value</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Project Value"
          value={`Rp\u00A0${new Intl.NumberFormat('id-ID').format(stats.totalValue)}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Project Status"
          icon={<ListChecks className="h-4 w-4 text-muted-foreground" />}
          value={
            <div className="space-y-1 text-sm pt-2">
              {PROJECT_STATUS_OPTIONS.map(option => {
                const count = stats.projectStatusCounts[option.value] || 0;
                const value = stats.projectStatusValues[option.value] || 0;
                const metric = viewMode === 'quantity' ? count : value;
                if (metric === 0) return null;
                return (
                  <div key={option.value} className="flex justify-between">
                    <span>{option.label}</span>
                    <span className="font-semibold">
                      {viewMode === 'quantity' ? count : `Rp\u00A0${new Intl.NumberFormat('id-ID').format(value)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          }
        />
        <StatCard
          title="Payment Status"
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          value={
            <div className="space-y-1 text-sm pt-2">
              {PAYMENT_STATUS_OPTIONS.map(option => {
                const count = stats.paymentStatusCounts[option.value] || 0;
                const value = stats.paymentStatusValues[option.value] || 0;
                const metric = viewMode === 'quantity' ? count : value;
                if (metric === 0) return null;
                return (
                  <div key={option.value} className="flex justify-between">
                    <span>{option.label}</span>
                    <span className="font-semibold">
                      {viewMode === 'quantity' ? count : `Rp\u00A0${new Intl.NumberFormat('id-ID').format(value)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          }
        />
        <StatCard
          title="Top Project Owner"
          icon={<UserIcon className="h-4 w-4 text-muted-foreground" />}
          value={
            <UserStat 
              user={topOwner}
              metric={viewMode === 'quantity' ? topOwner?.projectCount ?? 0 : topOwner?.totalValue ?? 0}
              metricType={viewMode}
            />
          }
        />
        <StatCard
          title="Top Collaborator"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          value={
            <UserStat 
              user={topCollaborator}
              metric={viewMode === 'quantity' ? topCollaborator?.projectCount ?? 0 : topCollaborator?.totalValue ?? 0}
              metricType={viewMode}
            />
          }
        />
        <StatCard
          title="Most Pending Payment"
          icon={<Hourglass className="h-4 w-4 text-muted-foreground" />}
          value={
            <UserStat 
              user={topPendingUser}
              metric={viewMode === 'quantity' ? topPendingUser?.projectCount ?? 0 : topPendingUser?.totalValue ?? 0}
              metricType={viewMode}
            />
          }
        />
      </div>
    </div>
  );
};

export default DashboardStatsGrid;