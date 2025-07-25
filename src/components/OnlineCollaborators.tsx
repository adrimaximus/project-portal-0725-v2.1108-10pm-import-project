import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collaborators } from "@/data/collaborators";

const OnlineCollaborators = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Online</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        {collaborators.map((c) => (
          <div key={c.name} className="flex flex-col items-center justify-center gap-2 w-20 text-center">
            <Avatar className="h-10 w-10 border-2 border-green-500">
              <AvatarImage src={c.src} alt={c.name} />
              <AvatarFallback>{c.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <span className="text-xs truncate w-full">{c.name}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OnlineCollaborators;