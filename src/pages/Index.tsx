import PortalLayout from "@/components/PortalLayout";
import { dummyProjects } from "@/data/projects";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to your Portal</h1>
          <p className="text-xl text-muted-foreground mt-2">Here's a quick overview of your projects.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dummyProjects.map((project) => (
            <Link to={`/projects/${project.id}`} key={project.id} className="block">
              <Card className="h-full flex flex-col hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <Badge variant="secondary" className="w-fit">{project.category}</Badge>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground text-sm mb-4">{project.description}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm text-muted-foreground">Team</span>
                    <div className="flex -space-x-2">
                      {project.assignedTo.map((user) => (
                        <Avatar key={user.id} className="h-8 w-8 border-2 border-card">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
};

export default Index;