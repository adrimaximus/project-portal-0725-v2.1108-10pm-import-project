import StatCard from "@/components/StatCard";
import { DollarSign, ListChecks, CreditCard, User, Users, TrendingUp, Hourglass } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardStatsGridProps {
  totalValue: number;
  projectStatusCounts: Record<string, number>;
  paymentStatusCounts: Record<string, number>;
  topOwner: any;
  topCollaborator: any;
  topUserByValue: any;
  topUserByPendingValue: any;
}

const DashboardStatsGrid = ({
  totalValue,
  projectStatusCounts,
  paymentStatusCounts,
  topOwner,
  topCollaborator,
  topUserByValue,
  topUserByPendingValue,
}: DashboardStatsGridProps) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <StatCard
      title="Total Project Value"
      value={'Rp ' + totalValue.toLocaleString('id-ID')}
      icon={DollarSign}
    />
    <StatCard
      title="Project Status"
      value={
        <div className="space-y-1 text-sm">
          {Object.entries(projectStatusCounts).map(([status, count]) => (
            <div key={status} className="flex justify-between">
              <span>{status}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      }
      icon={ListChecks}
    />
    <StatCard
      title="Payment Status"
      value={
        <div className="space-y-1 text-sm">
          {Object.entries(paymentStatusCounts).map(([status, count]) => (
            <div key={status} className="flex justify-between">
              <span>{status}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      }
      icon={CreditCard}
    />
    <StatCard
      title="Top Project Owner"
      value={
        topOwner ? (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={topOwner.avatar_url || undefined} alt={topOwner.name} />
              <AvatarFallback>{topOwner.initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-bold">{topOwner.name}</div>
              <p className="text-xs text-muted-foreground">{topOwner.projectCount} projects</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">0 projects</p>
          </div>
        )
      }
      icon={User}
    />
    <StatCard
      title="Most Collabs"
      value={
        topCollaborator ? (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={topCollaborator.avatar_url || undefined} alt={topCollaborator.name} />
              <AvatarFallback>{topCollaborator.initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-bold">{topCollaborator.name}</div>
              <p className="text-xs text-muted-foreground">{topCollaborator.projectCount} projects</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">0 projects</p>
          </div>
        )
      }
      icon={Users}
    />
    <StatCard
      title="Top Contributor"
      value={
        topUserByValue ? (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={topUserByValue.avatar_url || undefined} alt={topUserByValue.name} />
              <AvatarFallback>{topUserByValue.initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-bold">{topUserByValue.name}</div>
              <p className="text-xs text-muted-foreground">
                {'Rp ' + topUserByValue.totalValue.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">No value</p>
          </div>
        )
      }
      icon={TrendingUp}
    />
    <StatCard
      title="Most Pending Payment"
      value={
        topUserByPendingValue ? (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={topUserByPendingValue.avatar_url || undefined} alt={topUserByPendingValue.name} />
              <AvatarFallback>{topUserByPendingValue.initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-bold">{topUserByPendingValue.name}</div>
              <p className="text-xs text-muted-foreground">
                {'Rp ' + topUserByPendingValue.pendingValue.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">No pending payments</p>
          </div>
        )
      }
      icon={Hourglass}
    />
  </div>
);

export default DashboardStatsGrid;