import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { dummyProjects } from "@/data/projects";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const project = dummyProjects.find(p => p.id === projectId);

  if (!project) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Project not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="font-medium">Status:</span> <Badge>{project.status}</Badge></div>
              <div><span className="font-medium">Budget:</span> Rp {new Intl.NumberFormat('id-ID').format(project.budget)}</div>
              <div><span className="font-medium">Start Date:</span> {new Date(project.startDate).toLocaleDateString()}</div>
              <div><span className="font-medium">Deadline:</span> {new Date(project.deadline).toLocaleDateString()}</div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Assigned Team</h3>
            <div className="flex space-x-2">
              {project.assignedTo.map(user => (
                <Avatar key={user.id}>
                  <AvatarImage src={(user as any).avatar} alt={user.name} />
                  <AvatarFallback>{user.initials}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetailsPage;