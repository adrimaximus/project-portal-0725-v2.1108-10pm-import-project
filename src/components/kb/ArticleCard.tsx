import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { KbArticle } from '@/types/kb';

interface ArticleCardProps {
  article: KbArticle;
}

const ArticleCard = ({ article }: ArticleCardProps) => {
  const getTextColor = (hexcolor: string) => {
    if (!hexcolor) return '#ffffff';
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };

  return (
    <Card key={article.id} className="flex flex-col hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
        <CardDescription>
          In <span className="font-medium text-primary">{article.kb_folders.name}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-2">
          {article.tags.slice(0, 5).map((tag) => (
            <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: getTextColor(tag.color) }}>
              {tag.name}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Updated {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
        </span>
        <div className="flex items-center gap-2" title={article.creator.name}>
            <Avatar className="h-6 w-6">
              <AvatarImage src={article.creator.avatar_url} alt={article.creator.name} />
              <AvatarFallback>{article.creator.initials}</AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[100px]">{article.creator.name}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;