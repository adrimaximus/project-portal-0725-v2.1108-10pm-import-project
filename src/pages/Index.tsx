import { getProjects, getAssignableUsers, Project, AssignedUser } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, ListTodo, Users } from "lucide-react";
import { Link } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";

interface StatCardData {
  projectCount: number;
  totalValue: number;
  pendingValue: number;
}

interface TeamMemberStats extends AssignedUser {
  projectCount: number;
  taskCount: number;
}

const Index = () => {
  const projects = getProjects();
  const users = getAssignableUsers();

  const stats: StatCardData = {
    projectCount: projects.length,
    totalValue: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    pendingValue: projects.filter(p => p.paymentStatus === 'pending').reduce((sum, p) => sum + (p.budget || 0), 0),
  };

  const teamPerformance: TeamMemberStats[] = users.map(user => ({
    ...user,
    projectCount: projects.filter(p => p.assignedTo.some(u => u.id === user.id)).length,
    taskCount: projects.flatMap(p => p.tasks || []).filter(t => t.assignedTo?.includes(user.id)).length,
  }));

  const recentProjects = projects.slice(0, 5);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projectCount}</div>
              <p className="text-xs text-muted-foreground">+10% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.pendingValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+18.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">+19% from last month</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">End Date</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="font-medium">{project.name}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {project.createdBy.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{project.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{project.endDate}</TableCell>
                      <TableCell className="text-right">${project.budget?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              {teamPerformance.map(member => (
                <div key={member.id} className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.projectCount} projects, {member.taskCount} tasks</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/profile`}>View</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Index;