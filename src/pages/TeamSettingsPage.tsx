import { Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { useFeatures } from '@/contexts/FeaturesContext';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, PlusCircle, Search, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Invite = {
  id: number;
  email: string;
  role: string;
};

type Member = {
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: 'Active' | 'Suspended' | 'Pending invite';
  lastActive: string;
};

type Role = {
  value: string;
  label: string;
  description: string;
};

type CustomRole = Role & {
  permissions: Record<string, boolean>;
};

const initialMembers: Member[] = [
  { name: 'Theresa Webb', email: 'david@withlantern.com', avatar: 'TW', role: 'Owner', status: 'Active', lastActive: '23 Dec 2022' },
  { name: 'Darlene Robertson', email: 'darrell.steward@withlantern.com', avatar: 'DR', role: 'Member', status: 'Suspended', lastActive: '23 Dec 2022' },
  { name: 'Anne Black', email: 'sagar@withlantern.com', avatar: 'AB', role: 'Client', status: 'Active', lastActive: '23 Dec 2022' },
  { name: 'Floyd Miles', email: 'sagar@withlantern.com', avatar: 'FM', role: 'View Only', status: 'Pending invite', lastActive: '23 Dec 2022' },
  { name: 'Cody Fisher', email: 'sagar@withlantern.com', avatar: 'CF', role: 'Admin', status: 'Active', lastActive: '23 Dec 2022' },
  { name: 'Kristin Watson', email: 'darrell.steward@withlantern.com', avatar: 'KW', role: 'Comment Only', status: 'Pending invite', lastActive: '23 Dec 2022' },
  { name: 'Leslie Alexander', email: 'sagar@withlantern.com', avatar: 'LA', role: 'View Only', status: 'Pending invite', lastActive: '23 Dec 2022' },
];

const defaultRoles: Role[] = [
  { value: 'owner', label: 'Owner', description: 'Full access to the project and billing.' },
  { value: 'admin', label: 'Admin', description: 'Full access to manage the application and all its features.' },
  { value: 'member', label: 'Member', description: 'Can access the project and create new projects.' },
  { value: 'client', label: 'Client', description: 'Can access the project but cannot create new projects.' },
  { value: 'comment-only', label: 'Comment Only', description: 'Can comment in the project but cannot create or delete anything.' },
  { value: 'view-only', label: 'View Only', description: 'Can view the project but cannot do anything else.' },
];

const TeamSettingsPage = () => {
  const { features } = useFeatures();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [invites, setInvites] = useState<Invite[]>([{ id: Date.now(), email: '', role: 'member' }]);
  const [isCustomRoleDialogOpen, setCustomRoleDialogOpen] = useState(false);
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRolePermissions, setCustomRolePermissions] = useState<Record<string, boolean>>({});
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);

  useEffect(() => {
    const storedRoles = localStorage.getItem('customRoles');
    if (storedRoles) {
      setCustomRoles(JSON.parse(storedRoles));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('customRoles', JSON.stringify(customRoles));
  }, [customRoles]);

  const allRoles = useMemo(() => [...defaultRoles, ...customRoles], [customRoles]);

  const roleNameExists = useMemo(() => {
    const trimmedName = customRoleName.trim().toLowerCase();
    if (!trimmedName) return false;
    return allRoles.some(role => role.label.toLowerCase() === trimmedName);
  }, [customRoleName, allRoles]);

  useEffect(() => {
    if (isCustomRoleDialogOpen) {
      const initialPermissions = features.reduce((acc, feature) => {
        acc[feature.id] = false;
        return acc;
      }, {} as Record<string, boolean>);
      setCustomRolePermissions(initialPermissions);
      setCustomRoleName('');
    }
  }, [isCustomRoleDialogOpen, features]);

  const handlePermissionToggle = (featureId: string) => {
    setCustomRolePermissions(prev => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
  };

  const handleSaveCustomRole = () => {
    if (!customRoleName.trim() || roleNameExists) return;

    const newRole: CustomRole = {
      label: customRoleName.trim(),
      value: customRoleName.trim().toLowerCase().replace(/\s+/g, '-'),
      description: 'Custom role with specific permissions.',
      permissions: customRolePermissions,
    };

    setCustomRoles(prev => [...prev, newRole]);
    setCustomRoleDialogOpen(false);
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

  const handleToggleSuspend = (memberName: string) => {
    setMembers(currentMembers =>
      currentMembers.map(member => {
        if (member.name === memberName) {
          if (member.status === 'Pending invite') return member;
          return {
            ...member,
            status: member.status === 'Suspended' ? 'Active' : 'Suspended',
          };
        }
        return member;
      })
    );
  };

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

  const renderRoleOptions = (roles: Role[], customRoles: CustomRole[]) => (
    <>
      {roles.map(role => (
        <SelectItem key={role.value} value={role.value}>
          <div className="flex flex-col items-start py-1">
            <span>{role.label}</span>
            <span className="text-xs text-muted-foreground whitespace-normal">{role.description}</span>
          </div>
        </SelectItem>
      ))}
      {customRoles.length > 0 && <SelectSeparator />}
      {customRoles.map(role => (
        <SelectItem key={role.value} value={role.value}>
          <div className="flex flex-col items-start py-1">
            <span>{role.label}</span>
            <span className="text-xs text-muted-foreground whitespace-normal">{role.description}</span>
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
    </>
  );

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
              <BreadcrumbPage>Team Members & Access</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Team Members & Access
          </h1>
          <p className="text-muted-foreground">
            Manage your team members and their roles across the application.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invite Team Members</CardTitle>
            <CardDescription>
              Add your colleagues to collaborate and assign them a role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invites.map((invite) => (
                <div key={invite.id} className="flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-grow space-y-1.5 w-full">
                    <Label htmlFor={`email-${invite.id}`}>Email address</Label>
                    <Input
                      id={`email-${invite.id}`}
                      placeholder="name@example.com"
                      value={invite.email}
                      onChange={(e) => handleInviteChange(invite.id, 'email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 flex-shrink-0 w-full sm:w-auto">
                    <Label htmlFor={`role-${invite.id}`}>Role</Label>
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
                      <SelectTrigger id={`role-${invite.id}`} className="w-full sm:w-[220px]">
                        {allRoles.find(r => r.value === invite.role)?.label ?? <span className="text-muted-foreground">Select a role</span>}
                      </SelectTrigger>
                      <SelectContent>
                        {renderRoleOptions(defaultRoles, customRoles)}
                      </SelectContent>
                    </Select>
                  </div>
                  {invites.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeInviteField(invite.id)} className="flex-shrink-0">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="link" className="p-0 h-auto text-primary" onClick={addInviteField}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add another
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full sm:w-auto">Send Invites</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <CardTitle>Current Members</CardTitle>
                    <CardDescription>Review and manage existing team members.</CardDescription>
                </div>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name..." className="pl-8 w-full" />
                </div>
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
                    <TableHead className="w-[180px]">Role</TableHead>
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
                            <SelectTrigger className="w-full h-9 border-none focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {defaultRoles.map(role => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                              ))}
                              {customRoles.length > 0 && <SelectSeparator />}
                              {customRoles.map(role => (
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onSelect={() => handleToggleSuspend(member.name)}
                              disabled={member.status === 'Pending invite'}
                            >
                              {member.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                            </DropdownMenuItem>
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
              {roleNameExists && (
                <p className="text-sm text-red-500">A role with this name already exists.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2 pt-2 max-h-[300px] overflow-y-auto pr-3">
                {features
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(feature => (
                      <div key={feature.id} className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor={`perm-${feature.id}`} className="font-normal">{feature.name}</Label>
                        <Switch
                          id={`perm-${feature.id}`}
                          checked={customRolePermissions[feature.id] || false}
                          onCheckedChange={() => handlePermissionToggle(feature.id)}
                          disabled={feature.id === 'settings'}
                        />
                      </div>
                    ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCustomRole} disabled={!customRoleName.trim() || roleNameExists}>Save Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
};

export default TeamSettingsPage;