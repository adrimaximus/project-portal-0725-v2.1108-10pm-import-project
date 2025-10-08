import { KbArticle } from "@/types";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";

interface KBCardProps {
  article: KbArticle;
}

export default function KBCard({ article }: KBCardProps) {
  // Function to extract plain text from TipTap JSON
  const getPlainText = (content: any): string => {
    if (!content || !content.content) return "";
    return content.content.map((node: any) => {
      if (node.type === 'text') {
        return node.text;
      }
      if (node.content) {
        return getPlainText(node);
      }
      return '';
    }).join(' ');
  };

  const plainTextContent = getPlainText(article.content);

  return (
    <Link to={`/knowledge-base/articles/${article.slug}`}>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        {article.header_image_url && (
          <div className="h-40 overflow-hidden rounded-t-lg">
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
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                {tag.name}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={getAvatarUrl(article.creator.avatar_url) || undefined} alt={article.creator.name} />
              <AvatarFallback className="text-xs">{article.creator.initials}</AvatarFallback>
            </Avatar>
            <span>{article.creator.name}</span>
          </div>
          <span>
            {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}