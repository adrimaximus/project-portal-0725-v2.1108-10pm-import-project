import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dummyProjects, AssignedUser } from '@/data/projects';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PortalLayout from '@/components/PortalLayout';
import ProjectsTable from '@/components/ProjectsTable';

interface TeamStat extends AssignedUser {
  projectCount: number;
  taskCount: number;
}

interface ClientStat extends AssignedUser {
  projectCount: number;
  totalValue: number;
  pendingValue: number;
}

const Index = () => {
  const stats = useMemo(() => {
    const projectCount = dummyProjects.length;
    const totalValue = dummyProjects.reduce((sum, p) => sum + p.budget, 0);
    const pendingValue = dummyProjects
      .filter(p => p.paymentStatus !== 'Paid' && p.paymentStatus !== 'paid')
      .reduce((sum, p) => sum + p.budget, 0);
    return { projectCount, totalValue, pendingValue };
  }, []);

  const teamStats: TeamStat[] = useMemo(() => {
    const memberStats: { [key: string]: TeamStat } = {};
    dummyProjects.forEach(project => {
      project.assignedTo.forEach(member => {
        if (!memberStats[member.id]) {
          memberStats[member.id] = { ...member, projectCount: 0, taskCount: 0 };
        }
        memberStats[member.id].projectCount++;
        memberStats[member.id].taskCount += project.tasks?.filter(t => t.assignedTo?.includes(member.id)).length || 0;
      });
    });
    return Object.values(memberStats).sort((a, b) => b.projectCount - a.projectCount);
  }, []);

  const clientStats: ClientStat[] = useMemo(() => {
    const clientData: { [key: string]: ClientStat } = {};
    dummyProjects.forEach(project => {
      const client = project.createdBy;
      if (!clientData[client.id]) {
        clientData[client.id] = {
          ...client,
          projectCount: 0,
          totalValue: 0,
          pendingValue: 0,
        };
      }
      clientData[client.id].projectCount++;
      clientData[client.id].totalValue += project.budget;
      if (project.paymentStatus !== 'Paid' && project.paymentStatus !== 'paid') {
        clientData[client.id].pendingValue += project.budget;
      }
    });
    return Object.values(clientData).sort((a, b) => b.totalValue - a.totalValue);
  }, []);

  return (
    <PortalLayout>
      <div className="p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projectCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.pendingValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectsTable projects={dummyProjects} />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Team Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamStats.map(member => (
                <div key={member.id} className="flex items-center">
                  <Avatar>
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.projectCount} projects, {member.taskCount} tasks</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top Clients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientStats.map(client => (
                <div key={client.id} className="flex items-center">
                  <Avatar>
                    <AvatarImage src={client.avatar} alt={client.name} />
                    <AvatarFallback>{client.initials}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Value: ${client.totalValue.toLocaleString()}
                    </p>
                  </div>
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