import React, { useMemo } from 'react';
import { Project } from '@/data/projects';
import StatCard from './StatCard';
import { DollarSign, ListChecks, CreditCard, User, Users, TrendingUp, Hourglass } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardStatsGridProps {
  projects: Project[];
}

const DashboardStatsGrid = ({ projects }: DashboardStatsGridProps) => {
  const stats = useMemo(() => {
    const totalValue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

    const projectStatusCounts = projects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const paymentStatusCounts = projects.reduce((acc, p) => {
        acc[p.paymentStatus] = (acc[p.paymentStatus] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const ownerCounts = projects.reduce((acc, p) => {
        if (p.createdBy) {
            if (!acc[p.createdBy.id]) {
                acc[p.createdBy.id] = { ...p.createdBy, projectCount: 0 };
            }
            acc[p.createdBy.id].projectCount++;
        }
        return acc;
    }, {} as Record<string, any>);
    const topOwner = Object.values(ownerCounts).sort((a, b) => b.projectCount - a.projectCount)[0] || null;

    const collaboratorStats = projects.reduce((acc, p) => {
        p.assignedTo.forEach(user => {
            if (!acc[user.id]) {
                acc[user.id] = { ...user, projectCount: 0 };
            }
            acc[user.id].projectCount++;
        });
        return acc;
    }, {} as Record<string, any>);
    const topCollaborator = Object.values(collaboratorStats).sort((a, b) => b.projectCount - a.projectCount)[0] || null;

    const userValueCounts = projects.reduce((acc, p) => {
        p.assignedTo.forEach(user => {
            if (!acc[user.id]) {
                acc[user.id] = { ...user, totalValue: 0 };
            }
            acc[user.id].totalValue += p.budget || 0;
        });
        return acc;
    }, {} as Record<string, any>);
    const topUserByValue = Object.values(userValueCounts).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    const pendingPaymentCounts = projects
      .filter(p => p.paymentStatus === 'Pending')
      .reduce((acc, p) => {
          p.assignedTo.forEach(user => {
              if (!acc[user.id]) {
                  acc[user.id] = { ...user, pendingValue: 0 };
              }
              acc[user.id].pendingValue += p.budget || 0;
          });
          return acc;
      }, {} as Record<string, any>);
    const topUserByPendingValue = Object.values(pendingPaymentCounts).sort((a, b) => b.pendingValue - a.pendingValue)[0] || null;

    return {
      totalValue,
      projectStatusCounts,
      paymentStatusCounts,
      topOwner,
      topCollaborator,
      topUserByValue,
      topUserByPendingValue,
    };
  }, [projects]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Project Value"
        value={'Rp ' + stats.totalValue.toLocaleString('id-ID')}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Project Status"
        icon={<ListChecks className="h-4 w-4 text-muted-foreground" />}
        value={
          <div className="space-y-1 text-sm pt-2">
            {Object.entries(stats.projectStatusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span>{status}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        }
      />
      <StatCard
        title="Payment Status"
        icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
        value={
          <div className="space-y-1 text-sm pt-2">
            {Object.entries(stats.paymentStatusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span>{status}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        }
      />
      <StatCard
        title="Top Project Owner"
        icon={<User className="h-4 w-4 text-muted-foreground" />}
        value={
          stats.topOwner ? (
            <div className="flex items-center gap-4 pt-2">
              <Avatar>
                <AvatarImage src={stats.topOwner.avatar} alt={stats.topOwner.name} />
                <AvatarFallback>{stats.topOwner.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-bold">{stats.topOwner.name}</div>
                <p className="text-xs text-muted-foreground">{stats.topOwner.projectCount} projects</p>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <div className="text-2xl font-bold">N/A</div>
              <p className="text-xs text-muted-foreground">0 projects</p>
            </div>
          )
        }
      />
      <StatCard
        title="Most Collabs"
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        value={
          stats.topCollaborator ? (
            <div className="flex items-center gap-4 pt-2">
              <Avatar>
                <AvatarImage src={stats.topCollaborator.avatar} alt={stats.topCollaborator.name} />
                <AvatarFallback>{stats.topCollaborator.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-bold">{stats.topCollaborator.name}</div>
                <p className="text-xs text-muted-foreground">{stats.topCollaborator.projectCount} projects</p>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <div className="text-2xl font-bold">N/A</div>
              <p className="text-xs text-muted-foreground">0 projects</p>
            </div>
          )
        }
      />
      <StatCard
        title="Top Contributor"
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        value={
          stats.topUserByValue ? (
            <div className="flex items-center gap-4 pt-2">
              <Avatar>
                <AvatarImage src={stats.topUserByValue.avatar} alt={stats.topUserByValue.name} />
                <AvatarFallback>{stats.topUserByValue.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-bold">{stats.topUserByValue.name}</div>
                <p className="text-xs text-muted-foreground">
                  {'Rp ' + stats.topUserByValue.totalValue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <div className="text-2xl font-bold">N/A</div>
              <p className="text-xs text-muted-foreground">No value</p>
            </div>
          )
        }
      />
      <StatCard
        title="Most Pending Payment"
        icon={<Hourglass className="h-4 w-4 text-muted-foreground" />}
        value={
          stats.topUserByPendingValue ? (
            <div className="flex items-center gap-4 pt-2">
              <Avatar>
                <AvatarImage src={stats.topUserByPendingValue.avatar} alt={stats.topUserByPendingValue.name} />
                <AvatarFallback>{stats.topUserByPendingValue.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-bold">{stats.topUserByPendingValue.name}</div>
                <p className="text-xs text-muted-foreground">
                  {'Rp ' + stats.topUserByPendingValue.pendingValue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <div className="text-2xl font-bold">N/A</div>
              <p className="text-xs text-muted-foreground">No pending payments</p>
            </div>
          )
        }
      />
    </div>
  );
};

export default DashboardStatsGrid;