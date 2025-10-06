import React, { useMemo, useState, useEffect } from 'react';
import { Project, UserProfile, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/types';
import StatCard from './StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCurrencySymbol } from '@/lib/utils';

interface DashboardStatsGridProps {
  projects: Project[];
}

type CollaboratorStat = UserProfile & {
  projectCount: number;
  totalValue: number;
};

const DashboardStatsGrid = ({ projects }: DashboardStatsGridProps) => {
  const [timeRange, setTimeRange] = useState('all');
  const [currency, setCurrency] = useState('USD');

  const filteredProjects = useMemo(() => {
    if (timeRange === 'all') return projects;
    const now = new Date();
    return projects.filter(p => {
      if (!p.created_at) return false;
      const projectDate = new Date(p.created_at);
      if (timeRange === '7d') return now.getTime() - projectDate.getTime() < 7 * 24 * 60 * 60 * 1000;
      if (timeRange === '30d') return now.getTime() - projectDate.getTime() < 30 * 24 * 60 * 60 * 1000;
      if (timeRange === '90d') return now.getTime() - projectDate.getTime() < 90 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [projects, timeRange]);

  const totalProjects = filteredProjects.length;
  const totalValue = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const paidValue = filteredProjects.filter(p => p.payment_status === 'Paid').reduce((sum, p) => sum + (p.budget || 0), 0);
  const unpaidValue = totalValue - paidValue;

  const projectsByStatus = useMemo(() => {
    const statusCounts = PROJECT_STATUS_OPTIONS.map(opt => ({ name: opt.label, count: 0 }));
    filteredProjects.forEach(p => {
      const status = statusCounts.find(s => s.name === p.status);
      if (status) {
        status.count++;
      }
    });
    return statusCounts;
  }, [filteredProjects]);

  const projectsByPaymentStatus = useMemo(() => {
    const statusCounts = PAYMENT_STATUS_OPTIONS.map(opt => ({ name: opt.label, count: 0, value: 0 }));
    filteredProjects.forEach(p => {
      const status = statusCounts.find(s => s.name === p.payment_status);
      if (status) {
        status.count++;
        status.value += p.budget || 0;
      }
    });
    return statusCounts;
  }, [filteredProjects]);

  const topCollaborators = useMemo(() => {
    const collaboratorStats: { [key: string]: CollaboratorStat } = {};
    filteredProjects.forEach(p => {
      if (p.created_by && typeof p.created_by === 'object') {
        const createdBy = p.created_by;
        if (!collaboratorStats[createdBy.id]) {
          collaboratorStats[createdBy.id] = { ...createdBy, projectCount: 0, totalValue: 0 };
        }
        collaboratorStats[createdBy.id].projectCount++;
        collaboratorStats[createdBy.id].totalValue += p.budget || 0;
      }
      (p.assignedTo || []).forEach(collaborator => {
        if (!collaboratorStats[collaborator.id]) {
          collaboratorStats[collaborator.id] = { ...collaborator, projectCount: 0, totalValue: 0 };
        }
        collaboratorStats[collaborator.id].projectCount++;
      });
    });
    return Object.values(collaboratorStats).sort((a, b) => b.projectCount - a.projectCount).slice(0, 5);
  }, [filteredProjects]);

  const currencySymbol = getCurrencySymbol(currency);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);
  };

  const unpaidProjects = projects.filter(p => p.payment_status === 'Unpaid');
    const unpaidStats = unpaidProjects.reduce((acc, p) => {
        acc.count++;
        acc.value += p.budget || 0;
        return acc;
    }, { count: 0, value: 0 });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="JPY">JPY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Projects" value={totalProjects.toString()} />
        <StatCard title="Total Project Value" value={formatCurrency(totalValue)} />
        <StatCard title="Collected" value={formatCurrency(paidValue)} percentage={totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0} />
        <StatCard title="Outstanding" value={formatCurrency(unpaidValue)} percentage={totalValue > 0 ? Math.round((unpaidValue / totalValue) * 100) : 0} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Collaborators</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topCollaborators.map(c => (
                <li key={c.id} className="flex justify-between items-center">
                  <span>{c.name}</span>
                  <span className="font-semibold">{c.projectCount} projects</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStatsGrid;