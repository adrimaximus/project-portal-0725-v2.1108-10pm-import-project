import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ProjectSidebar = ({ project }: { project: Project }) => {
  // Perbaikan: Bandingkan dengan 'Online' (huruf besar 'O') agar sesuai dengan tipe
  const onlineMembers = project.assignedTo.filter(
    (member) => member.status === 'Online'
  );
  // Perbaikan: Bandingkan dengan 'Online' (huruf besar 'O') agar sesuai dengan tipe
  const isOwnerOnline = project.createdBy.status === 'Online';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Owner</h4>
            <div className="flex items-center gap-2 mt-2">
              <Avatar>
                <AvatarImage src={project.createdBy.avatar} />
                <AvatarFallback>{project.createdBy.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span>{project.createdBy.name}</span>
              {isOwnerOnline && <div className="h-2 w-2 rounded-full bg-green-500" />}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium">Members ({onlineMembers.length} online)</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {project.assignedTo.map(member => (
                <Avatar key={member.id}>
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectSidebar;