import React from 'react';
import PortalLayout from '@/components/PortalLayout';
import EditProjectDialog from '@/components/EditProjectDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users } from 'lucide-react';
import { format } from 'date-fns';

// Dummy data for demonstration
const project = {
  name: 'Existing Website Redesign',
  description: 'We need to refresh our existing corporate website with a new look and feel, focusing on mobile-first design and faster load times.',
  budget: 75000000,
  startDate: new Date('2024-08-01'),
  endDate: new Date('2024-10-31'),
  status: 'In Progress',
  services: ['Web Development', 'UI/UX Design', 'SEO Optimization'],
};

const ProjectDetailPage = () => {
  return (
    <PortalLayout pageActions={<EditProjectDialog />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground">Project details and status.</p>
          </div>
          <Badge variant={project.status === 'In Progress' ? 'default' : 'secondary'}>
            {project.status}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(project.budget)}
              </div>
              <p className="text-xs text-muted-foreground">Total project budget</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {format(project.startDate, 'd MMM yyyy')} - {format(project.endDate, 'd MMM yyyy')}
              </div>
              <p className="text-xs text-muted-foreground">Project start and end dates</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               <div className="text-lg font-bold">3 Members</div>
              <p className="text-xs text-muted-foreground">Design, Dev, QA</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {project.services.map(service => (
              <Badge key={service} variant="secondary">{service}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetailPage;