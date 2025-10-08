import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';

interface Collaborator {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
  role: string;
  project_count: number;
  last_active: string;
}

const CollaboratorsList = () => {
  const { data: collaborators, isLoading } = useQuery<Collaborator[]>({
    queryKey: ['dashboard-collaborators'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_collaborators');
      if (error) throw error;
      return data.map((c: any) => ({
        ...c,
        initials: (c.name ? (c.name.split(' ')[0][0] + (c.name.split(' ').length > 1 ? c.name.split(' ')[1][0] : '')) : c.email[0]).toUpperCase(),
      }));
    }
  });

  if (isLoading || !collaborators) {
    return <Card>
      <CardHeader>
        <CardTitle>Team Activity</CardTitle>
        <CardDescription>Overview of your team's project involvement.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-2">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Activity</CardTitle>
        <CardDescription>Overview of your team's project involvement.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collaborator</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="hidden md:table-cell">Active Projects</TableHead>
              <TableHead className="text-right">Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collaborators?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border-2 border-card">
                      <AvatarImage src={getAvatarUrl(c.avatar_url) || undefined} alt={c.name} />
                      <AvatarFallback style={{ backgroundColor: generatePastelColor(c.id) }}>{c.initials}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{c.name}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className="capitalize">{c.role}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{c.project_count}</TableCell>
                <TableCell className="text-right">{c.last_active}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full mt-4">
              View All Collaborators
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
            {collaborators?.map((c) => (
              <DropdownMenuItem key={c.id}>
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(c.avatar_url) || undefined} alt={c.name} />
                    <AvatarFallback style={{ backgroundColor: generatePastelColor(c.id) }}>{c.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.project_count} projects</span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};

export default CollaboratorsList;