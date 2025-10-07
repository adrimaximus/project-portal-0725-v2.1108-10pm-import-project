import { Article } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";

interface KBCardProps {
  article: Article;
}

const KBCard = ({ article }: KBCardProps) => {
  const plainTextContent = article.content?.blocks
    .map((block: any) => block.data.text)
    .join(' ') || '';

  return (
    <Link to={`/knowledge-base/${article.kb_folders.slug}/${article.slug}`}>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        {article.header_image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img src={article.header_image_url} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}
        <CardHeader>
          <CardTitle>{article.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {plainTextContent}
          </p>
          <div className="flex flex-wrap gap-1 mt-4">
            {article.tags?.map(tag => (
              <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: '#fff' }}>{tag.name}</Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            Updated {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-2">
            <span>{article.creator.name}</span>
            <Avatar className="h-6 w-6">
              <AvatarImage src={getAvatarUrl(article.creator)} alt={article.creator.name} />
              <AvatarFallback className="text-xs">{article.creator.initials}</AvatarFallback>
            </Avatar>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default KBCard;