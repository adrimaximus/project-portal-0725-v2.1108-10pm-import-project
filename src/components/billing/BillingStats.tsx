import { Invoice } from '@/types';
import StatCard from '@/components/dashboard/StatCard';
import { DollarSign, Clock, AlertTriangle, Users, Lock } from "lucide-react";
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

type UserStatData = User & {
  projectCount: number;
  totalValue: number;
};

const UserStat = ({ user, metric, metricType, canViewValue }: { user: UserStatData | null, metric: number, metricType: 'count' | 'value', canViewValue: boolean }) => {
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
    return metricType === 'count'
      ? `${new Intl.NumberFormat('id-ID').format(animatedMetric)} project${animatedMetric === 1 ? '' : 's'}`
      : `Rp\u00A0${new Intl.NumberFormat('id-ID').format(animatedMetric)}`;
  };

  return (
    <div className="flex items-center gap-2 pt-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.name} />
        <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
      </Avatar>
      <div>
        <div className="text-sm font-bold leading-tight">{user.name}</div>
        <p className="text-xs text-muted-foreground">
          {renderMetric()}
        </p>
      </div>
    </div>
  );
};

const BillingStats = ({ invoices }: { invoices: Invoice[] }) => {
  const [adminView, setAdminView] = useState<'count' | 'value'>('count');
  const { hasPermission } = useAuth();
  const canViewValue = hasPermission('projects:view_value');

  const stats = useMemo(() => {
    const outstandingBalance = invoices
      .filter(inv => ['Overdue', 'Proposed', 'Pending', 'In Process'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.amount, 0);

    const nextDueDate = invoices
      .filter(inv => ['Proposed', 'Pending', 'In Process'].includes(inv.status))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate;

    const overdueInvoicesCount = invoices.filter(inv => inv.status === 'Overdue').length;

    const projectAdmins = invoices.reduce((acc, invoice) => {
      invoice.assignedMembers
        .filter(member => member.role === 'admin')
        .forEach(admin => {
          if (!acc[admin.id]) {
            acc[admin.id] = { ...admin, projectCount: 0, totalValue: 0 };
          }
          acc[admin.id].projectCount++;
          acc[admin.id].totalValue += invoice.amount;
        });
      return acc;
    }, {} as Record<string, UserStatData>);

    return { outstandingBalance, nextDueDate, overdueInvoicesCount, projectAdmins };
  }, [invoices]);

  const sortedAdmins = useMemo(() => {
    const adminArray = Object.values(stats.projectAdmins);
    if (adminView === 'count') {
      return adminArray.sort((a, b) => b.projectCount - a.projectCount);
    }
    return adminArray.sort((a, b) => b.totalValue - a.totalValue);
  }, [stats.projectAdmins, adminView]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Outstanding Balance"
        value={`Rp ${stats.outstandingBalance.toLocaleString('id-ID')}`}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        description="Total amount due"
        permission="projects:view_value"
      />
      <StatCard
        title="Next Payment Due"
        value={stats.nextDueDate ? format(stats.nextDueDate, 'MMM dd, yyyy') : 'N/A'}
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        description="Date of next invoice payment"
      />
      <StatCard
        title="Overdue Invoices"
        value={stats.overdueInvoicesCount}
        icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
        description="Invoices past their due date"
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Admins</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {canViewValue && (
            <ToggleGroup
              type="single"
              value={adminView}
              onValueChange={(value) => { if (value) setAdminView(value as 'count' | 'value') }}
              className="mb-2 justify-end"
              size="sm"
            >
              <ToggleGroupItem value="count" aria-label="Show by project count">Qty</ToggleGroupItem>
              <ToggleGroupItem value="value" aria-label="Show by total value">Value</ToggleGroupItem>
            </ToggleGroup>
          )}
          <div className="space-y-3 max-h-24 overflow-y-auto pr-2">
            {sortedAdmins.length > 0 ? sortedAdmins.map(adminData => (
              <UserStat
                key={adminData.id}
                user={adminData}
                metric={adminView === 'count' ? adminData.projectCount : adminData.totalValue}
                metricType={adminView}
                canViewValue={canViewValue}
              />
            )) : (
              <p className="text-sm text-muted-foreground text-center pt-4">No project admins found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingStats;