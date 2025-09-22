import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';

export interface MultiEmbedItem {
  id: string;
  nav_item_id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  tags?: string[] | null;
  embed_content: string;
}

interface MultiEmbedCardProps {
  item: MultiEmbedItem;
  onEdit: (item: MultiEmbedItem) => void;
  onDelete: (id: string) => void;
}

const MultiEmbedCard: React.FC<MultiEmbedCardProps> = ({ item, onEdit, onDelete }) => {
  return (
    <Card className="flex flex-col h-full group relative">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
        <Button size="icon" variant="secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(item); }}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="destructive" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(item.id); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Link to={`/custom-page/${item.nav_item_id}/${item.id}`} className="flex flex-col h-full">
        <CardHeader className="p-0">
          <img src={item.image_url || 'https://via.placeholder.com/400x200'} alt={item.title} className="rounded-t-lg object-cover aspect-video" />
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col">
          <CardTitle className="text-lg font-semibold mb-1 truncate">{item.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground flex-grow mb-2 line-clamp-2">{item.description}</CardDescription>
          <div className="flex flex-wrap gap-1 mt-auto">
            {item.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default MultiEmbedCard;