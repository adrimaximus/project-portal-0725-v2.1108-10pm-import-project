import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PlusCircle, ChevronsUpDown, Edit, Trash2 } from 'lucide-react';
import { Role } from './RoleManagerDialog';

interface RolesCardProps {
  roles: Role[];
  onEditRole: (role: Role) => void;
  onDeleteRole: (role: Role) => void;
  onCreateRole: () => void;
  isMasterAdmin: boolean;
}

const roleColors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
];

const getRoleColorClass = (roleName: string) => {
    if (roleName === 'master admin') {
        return 'bg-slate-700';
    }
    let hash = 0;
    for (let i = 0; i < roleName.length; i++) {
        hash = roleName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % roleColors.length);
    return roleColors[index];
};

const RolesCard = ({ roles, onEditRole, onDeleteRole, onCreateRole, isMasterAdmin }: RolesCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => {
      if (a.name === 'master admin') return -1;
      if (b.name === 'master admin') return 1;
      if (a.is_predefined && !b.is_predefined) return -1;
      if (!a.is_predefined && b.is_predefined) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [roles]);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-6">
          <div>
            <CardTitle>Manage Roles</CardTitle>
            <CardDescription>Define roles and their permissions.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onCreateRole}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Role
            </Button>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRoles.map((role) => {
                  const canEdit = role.name !== 'master admin' && (!role.is_predefined || isMasterAdmin);
                  const canDelete = !role.is_predefined;
                  const colorClass = getRoleColorClass(role.name);

                  return (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium relative pl-6">
                        <span className={`absolute left-2 top-1/2 -translate-y-1/2 h-4 w-1 rounded-full ${colorClass}`} />
                        <span className="capitalize">{role.name}</span>
                      </TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {canEdit && (
                            <Button variant="ghost" size="icon" onClick={() => onEditRole(role)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" onClick={() => onDeleteRole(role)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default RolesCard;