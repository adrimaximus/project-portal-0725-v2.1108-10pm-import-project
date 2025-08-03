import PortalLayout from "@/components/PortalLayout";
import { dummyProjects, Project, Activity } from "@/data/projects";
import { User } from "@/data/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, DollarSign, ListChecks, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";

// Define the data structure for the summary hook
interface SummaryData {
  projectCount: { current: number; previous: number };
  totalValue: { current: number; previous: number };
  pendingValue: { current: number; previous: number };
  topProjects: Project[];
  recentActivity: Activity[];
  teamPerformance: (User & { projectCount: number; taskCount: number })[];
  topAssigneesByValue: (User & { totalValue: number })[];
  topAssigneesByPendingValue: (User & { pendingValue: number })[];
}

// Mock hook for generating summary data
const useSummaryData = (): SummaryData => {
  return useMemo(() => {
    const projects = dummyProjects;
    const users = [
        { id: '1', name: 'Alice', initials: 'AJ', avatar: '', email: 'a@a.com', projectCount: 10, taskCount: 50, totalValue: 50000, pendingValue: 10000 },
        { id: '2', name: 'Bob', initials: 'BW', avatar: '', email: 'b@b.com', projectCount: 8, taskCount: 40, totalValue: 40000, pendingValue: 8000 },
    ];

    return {
        projectCount: { current: projects.length, previous: projects.length - 2 },
        totalValue: { current: 125000, previous: 110000 },
        pendingValue: { current: 45000, previous: 55000 },
        topProjects: projects.slice(0, 5),
        recentActivity: projects.flatMap(p => p.activities || []).slice(0, 5),
        teamPerformance: users as any,
        topAssigneesByValue: users as any,
        topAssigneesByPendingValue: users as any,
    };
  }, []);
};


const StatCard = ({ title, value, previousValue, icon: Icon, description }: { title: string, value: string, previousValue: number, icon: React.ElementType, description: string }) => {
  const percentageChange = previousValue ? Math.round(((parseFloat(value.replace(/[^0-9.-]+/g,"")) - previousValue) / previousValue) * 100) : 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {percentageChange >= 0 ? `+${percentageChange}%` : `${percentageChange}%`} from last month
        </p>
      </CardContent>
    </Card>
  )
};

const Index = () => {
  const summaryData = useSummaryData();

  return (
    <PortalLayout>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <StatCard 
              title="Total Projects" 
              value={summaryData.projectCount.current.toString()} 
              previousValue={summaryData.projectCount.previous} 
              icon={ListChecks} 
              description="Total number of active projects"
            />
            <StatCard 
              title="Total Billed Value" 
              value={`$${summaryData.totalValue.current.toLocaleString()}`} 
              previousValue={summaryData.totalValue.previous} 
              icon={DollarSign} 
              description="Total value of all projects"
            />
             <StatCard 
              title="Pending Payments" 
              value={`$${summaryData.pendingValue.current.toLocaleString()}`} 
              previousValue={summaryData.pendingValue.previous} 
              icon={DollarSign} 
              description="Total value of pending payments"
            />
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Top Projects</CardTitle>
                <CardDescription>
                  Your most valuable and active projects.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link to="/projects">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-8">
              {summaryData.topProjects.map(project => (
                <div key={project.id} className="flex items-center gap-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.owner.name}</p>
                  </div>
                  <div className="ml-auto font-medium">
                    <Badge>{project.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Overview of project distribution.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {summaryData.teamPerformance.map(member => (
                <div key={member.id} className="flex items-center gap-4">
                  <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.projectCount} projects / {member.taskCount} tasks</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </PortalLayout>
  );
};

export default Index;