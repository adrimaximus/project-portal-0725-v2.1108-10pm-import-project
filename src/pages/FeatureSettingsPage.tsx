import { useParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { useFeatures } from '@/contexts/FeaturesContext';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, PlusCircle, Search, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FeatureSettingsPage = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const { features } = useFeatures();

  const feature = features.find(f => f.id === featureId);

  // Data dummy berdasarkan desain
  const members = [
    { name: 'Theresa Webb', email: 'david@withlantern.com', avatar: 'TW', role: 'Owner', status: 'Active', lastActive: '23 Dec 2022' },
    { name: 'Darlene Robertson', email: 'darrell.steward@withlantern.com', avatar: 'DR', role: 'User', status: 'Suspended', lastActive: '23 Dec 2022' },
    { name: 'Anne Black', email: 'sagar@withlantern.com', avatar: 'AB', role: 'User', status: 'Active', lastActive: '23 Dec 2022' },
    { name: 'Floyd Miles', email: 'sagar@withlantern.com', avatar: 'FM', role: 'Read only', status: 'Pending invite', lastActive: '23 Dec 2022' },
    { name: 'Cody Fisher', email: 'sagar@withlantern.com', avatar: 'CF', role: 'Admin', status: 'Active', lastActive: '23 Dec 2022' },
    { name: 'Kristin Watson', email: 'darrell.steward@withlantern.com', avatar: 'KW', role: 'Read only', status: 'Pending invite', lastActive: '23 Dec 2022' },
    { name: 'Leslie Alexander', email: 'sagar@withlantern.com', avatar: 'LA', role: 'Read only', status: 'Pending invite', lastActive: '23 Dec 2022' },
  ];

  const getStatusBadgeVariant = (status: string): "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'Suspended':
        return 'destructive';
      case 'Pending invite':
        return 'secondary';
      default:
        return 'outline';
    }
  };

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
              <BreadcrumbPage>Team Members</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Team Members
          </h1>
          <p className="text-muted-foreground">
            Manage your team members for the "{feature ? feature.name : 'Feature'}" feature.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name..." className="pl-8 w-full max-w-xs" />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader className="text-center items-center pt-4">
                    <div className="p-3 rounded-full bg-primary-foreground mb-2 inline-block">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-xl">Invite your team members</DialogTitle>
                    <DialogDescription>
                      Add your colleagues to collaborate and assign them a role.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <Input id="email" placeholder="name@example.com" />
                      <Select defaultValue="user">
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="read-only">Read only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="link" className="p-0 h-auto text-primary">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add another
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                    <Button className="w-full sm:w-auto">Send Invite</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{member.avatar}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell>
                        {member.status === 'Pending invite' ? (
                          <Badge variant={getStatusBadgeVariant(member.status)}>Pending invite</Badge>
                        ) : (
                          <span className="text-muted-foreground">{member.lastActive}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.status === 'Suspended' ? (
                          <Badge variant={getStatusBadgeVariant(member.status)}>Suspended</Badge>
                        ) : (
                          <Select defaultValue={member.role.toLowerCase().replace(' ', '-')}>
                            <SelectTrigger className="w-[120px] h-9 border-none focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="read-only">Read only</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default FeatureSettingsPage;