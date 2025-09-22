import React from 'react';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
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
}

const MultiEmbedCard: React.FC<MultiEmbedCardProps> = ({ item }) => {
  return (
    <Card className="group relative overflow-hidden">
      <Link to={`/custom-page/${item.nav_item_id}/${item.id}`} className="flex items-stretch">
        <div className="w-1/3 flex-shrink-0">
          <img src={item.image_url || 'https://via.placeholder.com/200x200'} alt={item.title} className="object-cover h-full w-full" />
        </div>
        <CardContent className="p-4 flex-grow flex flex-col justify-center w-2/3">
          <CardTitle className="text-md font-semibold mb-1 truncate">{item.title}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</CardDescription>
          <div className="flex flex-wrap gap-1 mt-auto">
            {item.tags?.map(tag => <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">{tag}</Badge>)}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default MultiEmbedCard;