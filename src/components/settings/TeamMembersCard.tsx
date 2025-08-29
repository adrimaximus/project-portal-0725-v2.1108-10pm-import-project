import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Search, Send, Trash2, ChevronsUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User } from '@/types';
import { Role } from './RoleManagerDialog';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

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

  const filteredMembers = useMemo(() => {
    return members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [members, searchTerm]);

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
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CollapsibleTrigger className="flex-grow text-left flex justify-between items-center">
              <div>
                  <CardTitle>Current Members</CardTitle>
                  <CardDescription>Review and manage existing team members.</CardDescription>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </CollapsibleTrigger>
            <div className="relative w-full sm:w-auto sm:max-w-xs" onClick={(e) => e.stopPropagation()}>
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
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
                    const availableRolesForMember = roles.filter(role => isMasterAdmin || role.name !== 'master admin');
                    const tooltipMessage = getDisabledTooltipMessage(member, currentUser);

                    return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar><AvatarImage src={member.avatar_url} /><AvatarFallback>{member.initials}</AvatarFallback></Avatar>
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
                          <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                <div className="w-full">
                                  <Select value={member.role || undefined} disabled>
                                    <SelectTrigger className="w-full h-9 border-none focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50">
                                      <SelectValue placeholder="No role assigned">
                                        {roles.find(r => r.name === member.role)?.name || member.role}
                                      </SelectValue>
                                    </SelectTrigger>
                                  </Select>
                                </div>
                              </TooltipTrigger><TooltipContent><p>{tooltipMessage}</p></TooltipContent></Tooltip></TooltipProvider>
                        ) : (
                          <Select value={member.role || undefined} onValueChange={(value) => onRoleChange(member.id, value)}>
                            <SelectTrigger className="w-full h-9 border-none focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent"><SelectValue placeholder="Select a role" /></SelectTrigger>
                            <SelectContent>
                              {availableRolesForMember.map(role => (
                                <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
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
                              {member.status === 'Pending invite' ? (
                                <>
                                  <DropdownMenuItem onSelect={() => onResendInvite(member)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Resend Invite
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onSelect={() => onDeleteMember(member)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Cancel Invite
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem onSelect={() => onToggleSuspend(member)} disabled={member.role === 'master admin' && !isMasterAdmin}>
                                    {member.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onSelect={() => onDeleteMember(member)} disabled={(member.role === 'master admin' && !isMasterAdmin)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )}}
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