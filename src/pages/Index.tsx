import PortalLayout from "@/components/PortalLayout";
import { dummyProjects } from "@/data/projects";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Index = () => {
  const navigate = useNavigate();

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to your Portal</h1>
          <p className="text-xl text-muted-foreground mt-2">Here's a quick overview of your projects.</p>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyProjects.map((project) => (
                <TableRow
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground hidden md:inline">
                      {project.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{project.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-x-3">
                      <Progress value={project.progress} className="h-2 w-20" />
                      <span className="text-sm text-muted-foreground">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2 justify-end">
                      {project.assignedTo.map((user) => (
                        <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Index;