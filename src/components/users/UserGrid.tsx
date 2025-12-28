import { useState, useMemo } from "react";
import { User, Collaborator } from "@/types";
import UserCard from "./UserCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UserGridProps {
  users: User[];
  onlineCollaborators: Collaborator[];
}

const UserGrid = ({ users, onlineCollaborators }: UserGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerTerm = searchTerm.toLowerCase();
    return users.filter(user => 
      user.name?.toLowerCase().includes(lowerTerm) || 
      user.email?.toLowerCase().includes(lowerTerm) ||
      user.role?.toLowerCase().includes(lowerTerm)
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search team members..." 
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          No users found matching "{searchTerm}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredUsers.map(user => (
            <UserCard 
              key={user.id} 
              user={user} 
              onlineStatus={onlineCollaborators.find(c => c.id === user.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserGrid;