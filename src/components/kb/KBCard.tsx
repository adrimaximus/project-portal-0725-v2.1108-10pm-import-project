import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { KbArticle } from "@/types";
import { FileText, ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

interface KBCardProps {
  article: KbArticle;
}

const extractTextFromHtml = (html: string | undefined): string => {
  if (!html) return "No description available.";
  const strippedHtml = html.replace(/<[^>]+>/g, '');
  if (strippedHtml.trim().length === 0) return "No description available.";
  return strippedHtml;
};

export function KBCard({ article }: KBCardProps) {
  const contentHtml = article.content?.html || (typeof article.content === 'string' ? article.content : '');
  const description = extractTextFromHtml(contentHtml);
  
  const tags = article.tags || [{ id: '1', name: 'Placeholder', color: '#3b82f6' }, { id: '2', name: 'Tag', color: '#8b5cf6' }];
  const creator = article.creator || { id: '1', name: 'Admin User', avatar_url: '', initials: 'AU' };

  return (
    <Link
      to={`/knowledge-base/articles/${article.slug}`}
      className="group relative flex items-center gap-4 h-full overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow duration-200 p-4"
    >
      {/* Image or Icon Section */}
      <div className="flex-shrink-0 w-24 h-full relative rounded-md overflow-hidden flex items-center justify-center">
        {article.header_image_url ? (
          <img src={article.header_image_url} alt={article.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <FileText className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-grow min-w-0 justify-center">
        <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors truncate">{article.title}</h3>
        
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.slice(0, 2).map(tag => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: `${tag.color}20`,
                borderColor: tag.color,
                color: tag.color,
              }}
            >
              {tag.name}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={creator.avatar_url} />
            <AvatarFallback>{creator.initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{creator.name}</span>
        </div>
      </div>

      {/* Link Icon */}
      <div className="absolute top-3 right-3 h-8 w-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowUpRight className="h-4 w-4 text-foreground" />
      </div>
    </Link>
  );
}