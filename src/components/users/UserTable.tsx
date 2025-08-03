import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, UserRole, UserStatus } from "@/data/users";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface UserTableProps {
  users: User[];
}

const statusColors: Record<UserStatus, string> = {
    'Active': 'border-transparent',
    'Suspended': 'bg-red-100 text-red-800 border-red-200',
    'Pending invite': 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const roles: UserRole[] = ['Owner', 'Admin', 'User', 'Read only'];

export const UserTable = ({ users }: UserTableProps) => {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Last active</TableHead>
            <TableHead className="w-[150px]">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell className="text-muted-foreground">
                <div className="flex items-center gap-2">
                    {user.lastActive}
                    {user.status !== 'Active' && (
                        <Badge variant="outline" className={cn("capitalize", statusColors[user.status])}>
                            {user.status}
                        </Badge>
                    )}
                </div>
              </TableCell>
              <TableCell>
                <Select defaultValue={user.role} disabled={user.role === 'Owner'}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};