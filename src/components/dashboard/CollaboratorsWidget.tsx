import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Collaborator } from '@/types';

const CollaboratorsWidget = () => {
    const { onlineCollaborators } = useAuth();
    const navigate = useNavigate();

    const handleCollaboratorClick = (collaborator: Collaborator) => {
        navigate('/chat', { 
          state: { 
            selectedCollaborator: collaborator
          } 
        });
    };

    if (onlineCollaborators.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-10">No collaborators are currently online.</p>
    }

    return (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {onlineCollaborators.map(c => (
              <div 
                key={c.id} 
                className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleCollaboratorClick(c)}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(c.avatar_url, c.id)} alt={c.name} />
                    <AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background ${c.isIdle ? 'bg-orange-400' : 'bg-green-500'}`} />
                </div>
                <span className="text-sm text-foreground font-medium">{c.name}</span>
              </div>
            ))}
        </div>
    );
};

export default CollaboratorsWidget;