import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Plus, Trash2, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User } from '@/types';
import { Role } from './RoleManagerDialog';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useTeamSettingsMutations } from '@/hooks/useTeamSettingsMutations';
import { useAuth } from '@/contexts/AuthContext';

type SortKey = keyof User | 'role' | 'last_active';

interface TeamMembersCardProps {
  members: User[];
  roles: Role[];
  onInvite: () => void;
  onEditRole: (role: Role) => void;
  onDeleteMember: (member: User) => void;
}

const TeamMembersCard = ({ members, roles, onInvite, onEditRole, onDeleteMember }: TeamMembersCardProps) => {
  const { user: currentUser } = useAuth();
  const [localMembers, setLocalMembers] = useState(members);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });
  const { updateMemberRole, toggleSuspendMember } = useTeamSettingsMutations();

  useEffect(() => {
    setLocalMembers(members);
  }, [members]);

  const isMasterAdmin = currentUser?.role === 'master admin';

  const handleRoleChange = (memberId: string, newRole: string) => {
    updateMemberRole.mutate({ memberId, newRole });
  };

  const handleToggleSuspend = (member: User) => {
    const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
    setLocalMembers(prevMembers =>
      prevMembers.map(m => m.id === member.id ? { ...m, status: newStatus } : m)
    );
    toggleSuspendMember.mutate(member);
  };

  const filteredAndSortedMembers = [...localMembers]
    .filter(member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortConfig.key as keyof User];
      const bValue = b[sortConfig.key as keyof User];
      if (aValue === undefined || aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (bValue === undefined || aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getStatusBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended': return 'destructive';
      case 'Pending invite': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage your team members and their roles.</CardDescription>
          </div>
          <Button onClick={onInvite}><Plus className="mr-2 h-4 w-4" /> Invite Member</Button>
        </div>
        <div className="mt-4">
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Button variant="ghost" onClick={() => requestSort('name')} className="px-0">Name {getSortIcon('name')}</Button></TableHead>
              <TableHead><Button variant="ghost" onClick={() => requestSort('role')} className="px-0">Role {getSortIcon('role')}</Button></TableHead>
              <TableHead><Button variant="ghost" onClick={() => requestSort('last_active')} className="px-0">Last Active {getSortIcon('last_active')}</Button></TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedMembers.map(member => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={getAvatarUrl(member.avatar_url, member.id)} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {member.status === 'Pending invite' ? (
                    <Badge variant={getStatusBadgeVariant(member.status)}>Pending invite</Badge>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="capitalize" disabled={member.id === currentUser?.id && !isMasterAdmin}>
                          {member.role} <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {roles.map(role => (
                          <DropdownMenuItem key={role.id} onSelect={() => handleRoleChange(member.id, role.name)}>
                            {role.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {member.updated_at ? formatDistanceToNow(new Date(member.updated_at), { addSuffix: true, locale: id }) : 'N/A'}
                  </span>
                  {member.status === 'suspended' ? (
                    <Badge variant={getStatusBadgeVariant(member.status)}>Suspended</Badge>
                  ) : member.status === 'Pending invite' ? (
                    <span className="text-muted-foreground capitalize">{member.role}</span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.status === 'Pending invite' ? (
                        <>
                          <DropdownMenuItem>Resend Invite</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onDeleteMember(member)} className="text-destructive">
                            Cancel Invite
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleToggleSuspend(member)} disabled={member.role === 'master admin' && !isMasterAdmin}>
                            {member.status === 'suspended' ? 'Unsuspend Member' : 'Suspend Member'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onDeleteMember(member)} className="text-destructive" disabled={member.id === currentUser?.id}>
                            Delete Member
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TeamMembersCard;