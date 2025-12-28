import { User, Collaborator } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, generatePastelColor, getInitials, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";

interface UserCardProps {
  user: User;
  onlineStatus?: Collaborator;
}

const UserCard = ({ user, onlineStatus }: UserCardProps) => {
  const isOnline = onlineStatus && !onlineStatus.isIdle;
  const isIdle = onlineStatus && onlineStatus.isIdle;

  return (
    <Link to={`/users/${user.id}`}>
      <Card className="h-full hover:shadow-md transition-all cursor-pointer group">
        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
              <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.name} />
              <AvatarFallback style={generatePastelColor(user.id)} className="text-lg">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            {onlineStatus && (
              <span className={cn(
                "absolute bottom-0 right-0 w-4 h-4 border-2 border-background rounded-full",
                isIdle ? "bg-orange-400" : "bg-green-500"
              )} />
            )}
          </div>
          
          <div className="space-y-1 w-full">
            <h3 className="font-semibold text-lg truncate" title={user.name}>{user.name}</h3>
            <p className="text-sm text-muted-foreground truncate" title={user.email || ''}>{user.email}</p>
          </div>

          <div className="flex gap-2 justify-center w-full">
            <Badge variant="secondary" className="capitalize">
              {user.role}
            </Badge>
          </div>

          <div className="pt-4 w-full grid grid-cols-2 gap-2 mt-auto">
             {user.email && (
                 <a 
                   href={`mailto:${user.email}`} 
                   className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary py-2 rounded-md hover:bg-muted transition-colors"
                   onClick={(e) => e.stopPropagation()}
                 >
                    <Mail className="h-3.5 w-3.5" /> Email
                 </a>
             )}
             {user.phone ? (
                 <a 
                    href={`tel:${user.phone}`}
                    className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary py-2 rounded-md hover:bg-muted transition-colors"
                    onClick={(e) => e.stopPropagation()}
                 >
                    <Phone className="h-3.5 w-3.5" /> Call
                 </a>
             ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/30 py-2">
                    <Phone className="h-3.5 w-3.5" /> Call
                </div>
             )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default UserCard;