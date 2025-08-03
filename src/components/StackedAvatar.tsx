import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collaborator } from "@/types";

interface StackedAvatarProps {
  members: Collaborator[];
  maxVisible?: number;
}

const StackedAvatar = ({ members, maxVisible = 2 }: StackedAvatarProps) => {
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = members.length - maxVisible;

  return (
    <div className="flex -space-x-4 rtl:space-x-reverse items-center">
      {visibleMembers.map((member) => (
        <Avatar key={member.id} className="h-10 w-10 border-2 border-background">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground -ml-4 z-10">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default StackedAvatar;