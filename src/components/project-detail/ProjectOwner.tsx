import { User } from "@/data/projects";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectOwnerProps {
  owner: User;
}

const ProjectOwner = ({ owner }: ProjectOwnerProps) => (
  <div>
    <h3 className="text-lg font-semibold mb-2">Project Owner</h3>
    <div className="flex items-center space-x-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={owner.avatar} alt={owner.name} />
        <AvatarFallback>{owner.initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{owner.name}</p>
        <p className="text-sm text-muted-foreground">{owner.email}</p>
      </div>
    </div>
  </div>
);

export default ProjectOwner;