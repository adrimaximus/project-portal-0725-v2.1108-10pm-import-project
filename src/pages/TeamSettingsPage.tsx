import { Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, PlusCircle, Search, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Invite = {
  id: number;
  email: string;
  role: string;
};

const roles = [
    { value: 'member', label: 'Member', description: 'Can access and create projects.' },
    { value: 'admin', label: 'Admin', description: 'Can manage users and projects.' },
    { value: 'master admin', label: 'Master Admin', description: 'Full access to all application settings and users.' },
    { value: 'client', label: 'Client', description: 'Can access assigned projects but cannot create new ones.' },
];

const TeamSettingsPage = () => {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([{ id: Date.now(), email: '', role: 'member' }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isMasterAdmin = currentUser?.role === 'master admin';
  const isAdmin = currentUser?.role === 'admin' || isMasterAdmin;

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      toast.error("Failed to fetch team members.");
      console.error(error);
    } else {
      const mappedUsers: User[] = data.map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'No name',
        email: profile.email,
        avatar: profile.avatar_url,
        role: profile.role,
        status: profile.status,
        initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
        updated_at: profile.updated_at,
      }));
      setMembers(mappedUsers);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filteredMembers = useMemo(() => {
    return members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [members, searchTerm]);

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

  const handleSendInvites = async () => {
    const validInvites = invites.filter(invite => invite.email.trim() !== '');
    if (validInvites.length === 0) {
      toast.error("Please enter at least one email address.");
      return;
    }

    let successCount = 0;
    toast.info(`Sending ${validInvites.length} invite(s)...`);

    for (const invite of validInvites) {
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { email: invite.email, role: invite.role },
      });

      if (error) {
        toast.error(`Failed to send invite to ${invite.email}: ${error.message}`);
      } else {
        successCount++;
        setMembers(prev => [...prev, {
          id: invite.email,
          name: invite.email,
          email: invite.email,
          role: invite.role,
          status: 'Pending invite',
          initials: '??',
        }]);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} invite(s) sent successfully!`);
      setInvites([{ id: Date.now(), email: '', role: 'member' }]);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
    if (error) {
      toast.error(`Failed to update role: ${error.message}`);
    } else {
      toast.success("Role updated successfully.");
      fetchMembers();
    }
  };

  const handleToggleSuspend = async (member: User) => {
    if (member.status === 'Pending invite') return;
    const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', member.id);
    if (error) {
      toast.error(`Failed to ${newStatus === 'active' ? 'unsuspend' : 'suspend'} member: ${error.message}`);
    } else {
      toast.success(`Member has been ${newStatus}.`);
      fetchMembers();
    }
  };

  const openDeleteDialog = (member: User) => {
    setMemberToDelete(member);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: memberToDelete.id },
    });
    if (error) {
      toast.error(`Failed to delete member: ${error.message}`);
    } else {
      toast.success(`Member ${memberToDelete.name} has been deleted.`);
      fetchMembers();
    }
    setMemberToDelete(null);
  };

  const getStatusBadgeVariant = (status: string): "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'suspended':
        return 'destructive';
      case 'Pending invite':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getDisabledTooltipMessage = (member: User, currentUser: User | null): string => {
    if (!currentUser) return "You are not logged in.";
    if (member.id === currentUser.id) return "You cannot change your own role.";
    if (member.role === 'master admin' && currentUser.role !== 'master admin') return "Only a Master Admin can change this role.";
    return "You do not have permission to change this role.";
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
            <CardTitle>Role Details</CardTitle>
            <CardDescription>
              Understand the permissions for each role in the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Role</TableHead>
                  <TableHead>Description & Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.value}>
                    <TableCell className="font-medium">{role.label}</TableCell>
                    <TableCell>
                      <p>{role.description}</p>
                      {(role.value === 'admin' || role.value === 'master admin') && (
                        <p className="text-sm text-muted-foreground mt-1">
                          - Access to <Link to="/settings" className="text-primary hover:underline">Settings</Link> page.
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {isAdmin && (
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
                        onValueChange={(value) => handleInviteChange(invite.id, 'role', value)}
                      >
                        <SelectTrigger id={`role-${invite.id}`} className="w-full sm:w-[220px]">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.filter(r => isMasterAdmin || r.value !== 'master admin').map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex flex-col items-start py-1">
                                <span>{role.label}</span>
                              </div>
                            </SelectItem>
                          ))}
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
              <Button className="w-full sm:w-auto" onClick={handleSendInvites}>Send Invites</Button>
            </CardFooter>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <CardTitle>Current Members</CardTitle>
                    <CardDescription>Review and manage existing team members.</CardDescription>
                </div>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[180px]">Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center">Loading members...</TableCell></TableRow>
                  ) : filteredMembers.map((member) => {
                    const isRoleChangeDisabled = !isAdmin || member.id === currentUser?.id || (member.role === 'master admin' && !isMasterAdmin);
                    const availableRolesForMember = roles.filter(role => isMasterAdmin || role.value !== 'master admin');
                    const tooltipMessage = getDisabledTooltipMessage(member, currentUser);

                    return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{member.name}</span>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.status === 'Pending invite' ? (
                          <Badge variant={getStatusBadgeVariant(member.status)}>Pending invite</Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            {member.updated_at ? formatDistanceToNow(new Date(member.updated_at), { addSuffix: true, locale: id }) : 'N/A'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.status === 'suspended' ? (
                          <Badge variant={getStatusBadgeVariant(member.status)}>Suspended</Badge>
                        ) : member.status === 'Pending invite' ? (
                          <span className="text-muted-foreground capitalize">{member.role}</span>
                        ) : isRoleChangeDisabled ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full">
                                  <Select value={member.role} disabled>
                                    <SelectTrigger className="w-full h-9 border-none focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50">
                                      <SelectValue placeholder={roles.find(r => r.value === member.role)?.label || member.role} />
                                    </SelectTrigger>
                                  </Select>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent><p>{tooltipMessage}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleRoleChange(member.id, value)}
                          >
                            <SelectTrigger className="w-full h-9 border-none focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRolesForMember.map(role => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.id !== currentUser?.id && isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => handleToggleSuspend(member)}
                                disabled={member.status === 'Pending invite' || (member.role === 'master admin' && !isMasterAdmin)}
                              >
                                {member.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onSelect={() => openDeleteDialog(member)}
                                disabled={(member.role === 'master admin' && !isMasterAdmin)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete {memberToDelete?.name} from the team. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteMember}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </PortalLayout>
  );
};

export default TeamSettingsPage;