import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projects as allProjectsData, users as allUsersData, Project, User } from "@/data/projects";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Activity, CreditCard, DollarSign, Users } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
}

const StatCard = ({ title, value, icon: Icon, description }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

interface TeamMember extends User {
  projectCount: number;
  taskCount: number;
}

const Index = () => {
  const totalProjects = allProjectsData.length;
  const totalBudget = allProjectsData.reduce((sum, p) => sum + (p.budget || 0), 0);
  const completedProjects = allProjectsData.filter(p => p.status === 'Completed').length;

  const teamMembersWithStats: TeamMember[] = allUsersData.map(user => {
    const assignedProjects = allProjectsData.filter(p => p.assignedTo.some(u => u.id === user.id));
    const taskCount = assignedProjects.reduce((sum, p) => sum + (p.tasks?.filter(t => t.assignedTo?.includes(user.id))?.length || 0), 0);
    return {
      ...user,
      projectCount: assignedProjects.length,
      taskCount: taskCount,
    };
  }).sort((a, b) => b.projectCount - a.projectCount);

  const recentProjects = [...allProjectsData].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Projects" value={totalProjects.toString()} icon={Activity} description="All projects in the system" />
        <StatCard title="Total Budget" value={`$${(totalBudget / 1000).toFixed(0)}k`} icon={DollarSign} description="Sum of all project budgets" />
        <StatCard title="Team Members" value={allUsersData.length.toString()} icon={Users} description="Total active users" />
        <StatCard title="Completed" value={completedProjects.toString()} icon={CreditCard} description={`${Math.round((completedProjects/totalProjects)*100)}% of all projects`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map(project => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={project.createdBy.avatar} />
                      <AvatarFallback>{project.createdBy.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link to={`/projects/${project.id}`} className="font-medium hover:underline">{project.name}</Link>
                      <p className="text-sm text-muted-foreground">{project.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'}>{project.status}</Badge>
                     <p className="text-sm text-muted-foreground mt-1">{project.progress}% complete</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembersWithStats.slice(0, 5).map(member => (
                <div key={member.id} className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.projectCount} projects, {member.taskCount} tasks</p>
                  </div>
                  <Progress value={(member.projectCount / totalProjects) * 100} className="w-1/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;