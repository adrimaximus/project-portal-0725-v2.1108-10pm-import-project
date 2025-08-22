import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { getIconComponent } from '@/data/icons';
import { Folder } from 'lucide-react';
import { generateVibrantGradient } from '@/lib/utils';
import { KbFolder } from '@/types';

const FolderCard = ({ folder }: { folder: KbFolder }) => {
  const Icon = getIconComponent(folder.icon) || Folder;

  return (
    <Link to={`/knowledge-base/folders/${folder.id}`} className="block group">
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${folder.color}20` }}>
            <Icon className="h-6 w-6" style={{ color: folder.color }} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">{folder.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{folder.article_count} article{folder.article_count !== 1 ? 's' : ''}</p>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2">{folder.description || 'No description.'}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex -space-x-2">
            {folder.collaborators.slice(0, 3).map(c => (
              <Avatar key={c.id} className="h-6 w-6 border-2 border-card">
                <AvatarImage src={c.avatar_url} />
                <AvatarFallback style={generateVibrantGradient(c.id)}>{c.initials}</AvatarFallback>
              </Avatar>
            ))}
            {folder.collaborators.length > 3 && (
              <Avatar className="h-6 w-6 border-2 border-card">
                <AvatarFallback>+{folder.collaborators.length - 3}</AvatarFallback>
              </Avatar>
            )}
          </div>
          <span>Edited {formatDistanceToNow(new Date(folder.updated_at), { addSuffix: true, locale: id })}</span>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default FolderCard;