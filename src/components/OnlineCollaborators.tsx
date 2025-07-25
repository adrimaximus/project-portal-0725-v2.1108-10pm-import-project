import { collaborators } from "@/data/collaborators";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "./ui/badge";

const OnlineCollaborators = () => {
  const onlineCollaborators = collaborators.filter(
    (collaborator) => collaborator.online
  );

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-base">Online Collaborators</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-4">
          {onlineCollaborators.map((collaborator) => (
            <div key={collaborator.id} className="flex items-center gap-3">
              <Avatar className="h-9 w-9 relative">
                <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{collaborator.name}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnlineCollaborators;