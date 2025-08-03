import { useParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { useFeatures } from '@/contexts/FeaturesContext';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, PlusCircle, Search, Users, X, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type Invite = {
  id: number;
  email: string;
  role: string;
};

const defaultRoles = [
  { value: 'owner', label: 'Owner', description: 'Full access to the project and billing.' },
  { value: 'admin', label: 'Admin', description: 'Full access to manage the application and all its features.' },
  { value: 'member', label: 'Member', description: 'Can access the project and create new projects.' },
  { value: 'client', label: 'Client', description: 'Can access the project but cannot create new projects.' },
  { value: 'comment-only', label: 'Comment Only', description: 'Can comment in the project but cannot create or delete anything.' },
  { value: 'view-only', label: 'View Only', description: 'Can view the project but cannot do anything else.' },
];

const FeatureSettingsPage = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const { features } = useFeatures();
  const [invites, setInvites] = useState<Invite[]>([{ id: Date.now(), email: '', role: 'member' }]);
  const [isCustomRoleDialogOpen, setCustomRoleDialogOpen] = useState(false);
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRolePermissions, setCustomRolePermissions] = useState<Record<string, any>>({});

  const feature = features.find(f => f.id === featureId);

  useEffect(() => {
    if (isCustomRoleDialogOpen) {
      const initialPermissions = features.reduce((acc, feature) => {
        if (feature.id === 'projects') {
          acc[feature.id] = {
            create: false,
            edit: false,
            comment: false,
            view: false,
          };
        } else {
          acc[feature.id] = false;
        }
        return acc;
      }, {} as Record<string, any>);
      setCustomRolePermissions(initialPermissions);
      setCustomRoleName('');
    }
  }, [isCustomRoleDialogOpen, features]);

  const handlePermissionToggle = (featureId: string, subPermission?: string) => {
    setCustomRolePermissions(prev => {
      const newPermissions = JSON.parse(JSON.stringify(prev));
      if (subPermission) {
        newPermissions[featureId][subPermission] = !newPermissions[featureId][subPermission];
      } else {
        const currentValue = newPermissions[featureId];
        if (typeof currentValue === 'object' && currentValue !== null) {
          const allEnabled = Object.values(currentValue).every(v => v);
          Object.keys(currentValue).forEach(key => {
            newPermissions[featureId][key] = !allEnabled;
          });
        } else {
          newPermissions[featureId] = !currentValue;
        }
      }
      return newPermissions;
    });
  };

  const handleInviteChange = (id: number, field: 'email' | 'role', value: string) => {
    setInvites(currentInvites =>
      currentInvites.map(invite =>
        invite.id === id ? { ...invite, [field]: value } : invite
      )
    );
  };

  const addInviteField = () => {
    setInvites(currentInvites => [...currentInvites, { id: Date.now(), email: '', role: 'member' }]);
  };

  const removeInviteField = (id: number) => {
    setInvites(currentInvites => currentInvites.filter(invite => invite.id !== id));
  };

  const members = [
    { name: 'Theresa Webb', email: 'david@withlantern.com', avatar: 'TW', role: 'Owner', status: 'Active', lastActive: '23 Dec 2022' },
    { name: 'Darlene Robertson', email: 'darrell.steward@withlantern.com', avatar: 'DR', role: 'Member', status: 'Suspended', lastActive: '23 Dec 2022' },
    { name: 'Anne Black', email: 'sagar@withlantern.com', avatar: 'AB', role: 'Client', status: 'Active', lastActive: '23 Dec 2022' },
    { name: 'Floyd Miles', email: 'sagar@withlantern.com', avatar: 'FM', role: 'View Only', status: 'Pending invite', lastActive: '23 Dec 2022' },
    { name: 'Cody Fisher', email: 'sagar@withlantern.com', avatar: 'CF', role: 'Admin', status: 'Active', lastActive: '23 Dec 2022' },
    { name: 'Kristin Watson', email: 'darrell.steward@withlantern.com', avatar: 'KW', role: 'Comment Only', status: 'Pending invite', lastActive: '23 Dec 2022' },
    { name: 'Leslie Alexander', email: 'sagar@withlantern.com', avatar: 'LA', role: 'View Only', status: 'Pending invite', lastActive: '23 Dec 2022' },
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
                    {invites.map((invite) => (
                      <div key={invite.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                        <Input
                          id={`email-${invite.id}`}
                          placeholder="name@example.com"
                          value={invite.email}
                          onChange={(e) => handleInviteChange(invite.id, 'email', e.target.value)}
                        />
                        <Select
                          value={invite.role}
                          onValueChange={(value) => {
                            if (value === 'create-custom') {
                              setCustomRoleDialogOpen(true);
                            } else {
                              handleInviteChange(invite.id, 'role', value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {defaultRoles.map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex flex-col items-start py-1">
                                  <span>{role.label}</span>
                                  <span className="text-xs text-muted-foreground">{role.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                            <SelectSeparator />
                            <SelectItem value="create-custom">
                              <div className="flex flex-col items-start py-1">
                                <span>Create Custom Role</span>
                                <span className="text-xs text-muted-foreground">Set granular permissions.</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {invites.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeInviteField(invite.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="link" className="p-0 h-auto text-primary" onClick={addInviteField}>
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
                          <Select defaultValue={member.role.toLowerCase().replace(/\s+/g, '-')}>
                            <SelectTrigger className="w-[120px] h-9 border-none focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {defaultRoles.map(role => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                              ))}
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

      <Dialog open={isCustomRoleDialogOpen} onOpenChange={setCustomRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>
              Set granular permissions for people based on roles. With custom roles, you're in complete control of locking down your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g., Contractor"
                value={customRoleName}
                onChange={(e) => setCustomRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2 pt-2 max-h-[300px] overflow-y-auto pr-3">
                {features
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(feature => {
                    if (feature.id === 'projects') {
                      const projectPermissions = customRolePermissions.projects || {};
                      const areAllProjectPermissionsEnabled = Object.values(projectPermissions).every(p => p === true);
                      return (
                        <Collapsible key={feature.id} className="space-y-2">
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-2 flex-1 cursor-pointer">
                                <Label className="font-normal flex-1 cursor-pointer">{feature.name}</Label>
                                <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                              </div>
                            </CollapsibleTrigger>
                            <Switch
                              id={`perm-${feature.id}`}
                              checked={areAllProjectPermissionsEnabled}
                              onCheckedChange={() => handlePermissionToggle(feature.id)}
                            />
                          </div>
                          <CollapsibleContent className="space-y-2 pl-6 pr-2">
                            <div className="flex items-center justify-between rounded-lg border p-3">
                              <Label htmlFor="perm-projects-create" className="font-normal">Create project</Label>
                              <Switch
                                id="perm-projects-create"
                                checked={projectPermissions.create || false}
                                onCheckedChange={() => handlePermissionToggle('projects', 'create')}
                              />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                              <Label htmlFor="perm-projects-edit" className="font-normal">Edit project</Label>
                              <Switch
                                id="perm-projects-edit"
                                checked={projectPermissions.edit || false}
                                onCheckedChange={() => handlePermissionToggle('projects', 'edit')}
                              />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                              <Label htmlFor="perm-projects-comment" className="font-normal">Comment</Label>
                              <Switch
                                id="perm-projects-comment"
                                checked={projectPermissions.comment || false}
                                onCheckedChange={() => handlePermissionToggle('projects', 'comment')}
                              />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                              <Label htmlFor="perm-projects-view" className="font-normal">View</Label>
                              <Switch
                                id="perm-projects-view"
                                checked={projectPermissions.view || false}
                                onCheckedChange={() => handlePermissionToggle('projects', 'view')}
                              />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    }
                    return (
                      <div key={feature.id} className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor={`perm-${feature.id}`} className="font-normal">{feature.name}</Label>
                        <Switch
                          id={`perm-${feature.id}`}
                          checked={customRolePermissions[feature.id] || false}
                          onCheckedChange={() => handlePermissionToggle(feature.id)}
                          disabled={feature.id === 'settings'}
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setCustomRoleDialogOpen(false)}>Save Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
};

export default FeatureSettingsPage;