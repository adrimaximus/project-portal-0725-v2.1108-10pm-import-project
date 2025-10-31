import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Search, Send, Trash2, ChevronsUpDown, User as UserIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User } from '@/types';
import { Role } from './RoleManagerDialog';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarUrl, safeFormatDistanceToNow } from '@/lib/utils';

interface TeamMembersCardProps {
  members: User[];
  roles: Role[];
  currentUser: User | null;
  isLoading: boolean;
  onRoleChange: (memberId: string, newRole: string) => void;
  onToggleSuspend: (member: User) => void;
  onDeleteMember: (member: User) => void;
  onResendInvite: (member: User) => void;
}

const capitalizeWords = (str: string) => {
  if (!str) return '';
  // Handle roles like 'master admin' or 'BD' which might be all caps or mixed case
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const TeamMembersCard = ({
  members,
  roles,
  currentUser,
  isLoading,
  onRoleChange,
  onToggleSuspend,
  onDeleteMember,
  onResendInvite,
}: TeamMembersCardProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { startImpersonation } = useAuth();
  
  // Local state for optimistic UI updates
  const [localMembers, setLocalMembers] = useState<User[]>(members);

  useEffect(() => {
    setLocalMembers(members);
  }, [members]);

  const processedRoles = useMemo(() => {
    return [...roles]
      .map(role => ({
        ...role,
        displayName: capitalizeWords(role.name),
      }))
      .sort((a, b) => {
        if (a.name === 'master admin') return -1;
        if (b.name === 'master admin') return 1;
        if (a.is_predefined && !b.is_predefined) return -1;
        if (!a.is_predefined && b.is_predefined) return 1;
        return a.displayName.localeCompare(b.displayName);
      });
  }, [roles]);

  const getRoleDisplayName = (roleName: string) => {
    const role = processedRoles.find(r => r.name === roleName);
    return role ? role.displayName : capitalizeWords(roleName);
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    setLocalMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
    onRoleChange(memberId, newRole);
  };

  const handleToggleSuspend = (member: User) => {
    const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
    setLocalMembers(prevMembers =>
      prevMembers.map(m =>
        m.id === member.id ? { ...m, status: newStatus } : m
      )
    );
    onToggleSuspend(member);
  };

  const handleDeleteMember = (member: User) => {
    setLocalMembers(prevMembers => prevMembers.filter(m => m.id !== member.id));
    onDeleteMember(member);
  };

  const filteredMembers = useMemo(() => {
    return localMembers.filter(member =>
        (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [localMembers, searchTerm]);

  const getStatusBadgeVariant = (status?: string): "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'suspended': return 'destructive';
      case 'Pending invite': return 'secondary';
      default: return 'outline';
    }
  };

  const getDisabledTooltipMessage = (member: User, currentUser: User | null): string => {
    if (!currentUser) return "You are not logged in.";
    if (member.id === currentUser.id) return "You cannot change your own role.";
    if (member.role === 'master admin' && currentUser.role !== 'master admin') return "Only a Master Admin can change this role.";
    return "You do not have permission to change this role.";
  };

  const isMasterAdmin = currentUser?.role === 'master admin';
  const isAdmin = currentUser?.role === 'admin' || isMasterAdmin;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-6">
          <div>
            <CardTitle>Current Members</CardTitle>
            <CardDescription>Review and manage existing team members.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ChevronsUpDown className="h-4 w-4" />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
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
                    const availableRolesForMember = processedRoles.filter(r => isMasterAdmin || r.name !== 'master admin');
                    const tooltipMessage = getDisabledTooltipMessage(member, currentUser);

                    return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar><AvatarImage src={getAvatarUrl(member.avatar_url, member.id)} /><AvatarFallback>{member.initials}</AvatarFallback></Avatar>
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
                            {safeFormatDistanceToNow(member.updated_at) || 'N/A'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.status === 'suspended' ? (
                          <Badge variant={getStatusBadgeVariant(member.status)}>Suspended</Badge>
                        ) : member.status === 'Pending invite' ? (
                          <span className="text-muted-foreground capitalize">{getRoleDisplayName(member.role || 'member')}</span>
                        ) : isRoleChangeDisabled ? (
                          <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                <div className="w-full">
                                  <Select value={member.role || undefined} disabled>
                                    <SelectTrigger className="w-full h-9 border-none focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50">
                                      <SelectValue placeholder="No role assigned">
                                        {getRoleDisplayName(member.role || 'member')}
                                      </SelectValue>
                                    </SelectTrigger>
                                  </Select>
                                </div>
                              </TooltipTrigger><TooltipContent><p>{tooltipMessage}</p></TooltipContent></Tooltip></TooltipProvider>
                        ) : (
                          <Select value={member.role || undefined} onValueChange={(value) => handleRoleChange(member.id, value)}>
                            <SelectTrigger className="w-full h-9 border-none focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent"><SelectValue placeholder="Select a role" /></SelectTrigger>
                            <SelectContent>
                              {availableRolesForMember.map(role => (
                                <SelectItem key={role.id} value={role.name}>{role.displayName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.id !== currentUser?.id && isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isMasterAdmin && (
                                <>
                                  <DropdownMenuItem onSelect={() => startImpersonation(member)}>
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    Impersonate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {member.status === 'Pending invite' ? (
                                <>
                                  <DropdownMenuItem onSelect={() => onResendInvite(member)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Resend Invite
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onSelect={() => handleDeleteMember(member)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Cancel Invite
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem onSelect={() => handleToggleSuspend(member)} disabled={member.role === 'master admin' && !isMasterAdmin}>
                                    {member.status === 'suspended' ? 'Unsuspend Member' : 'Suspend Member'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onSelect={() => handleDeleteMember(member)} disabled={(member.role === 'master admin' && !isMasterAdmin)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Member
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default TeamMembersCard;