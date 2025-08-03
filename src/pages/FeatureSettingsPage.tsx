import { useParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { useFeatures } from '@/contexts/FeaturesContext';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal } from 'lucide-react';

const FeatureSettingsPage = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const { features } = useFeatures();

  const feature = features.find(f => f.id === featureId);

  // Data dummy untuk undangan yang tertunda
  const pendingInvitations = [
    { email: 'alex@example.com', date: '2 days ago' },
    { email: 'sandra@example.com', date: '5 days ago' },
    { email: 'mike@example.com', date: '1 week ago' },
  ];

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings">Settings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{feature ? feature.name : 'Feature'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {feature ? `${feature.name} Settings` : 'Feature Settings'}
          </h1>
          <p className="text-muted-foreground">
            {feature ? feature.description : 'Manage settings for this feature.'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Kartu Undang Anggota */}
          <Card>
            <CardHeader>
              <CardTitle>Invite Members</CardTitle>
              <CardDescription>
                Invite new members to collaborate on the "{feature?.name}" feature.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input type="email" placeholder="Email address" />
                <Button>Send Invitation</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                They will receive an email with a link to join.
              </p>
            </CardContent>
          </Card>

          {/* Kartu Undangan Tertunda */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                These users have been invited but have not yet joined.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingInvitations.map((invitation, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>{invitation.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">Invited {invitation.date}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Resend Invitation</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Revoke</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default FeatureSettingsPage;