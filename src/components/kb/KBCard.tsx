import React from "react";
import { Link } from "react-router-dom";
import { KbArticle } from "@/types";
import { FileText, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface KBCardProps {
  article: KbArticle;
  onEdit: (article: KbArticle) => void;
  onDelete: (article: KbArticle) => void;
}

const extractTextFromHtml = (html: string | undefined): string => {
  if (!html) return "No description available.";
  const strippedHtml = html.replace(/<[^>]+>/g, '');
  if (strippedHtml.trim().length === 0) return "No description available.";
  return strippedHtml;
};

export function KBCard({ article, onEdit, onDelete }: KBCardProps) {
  const contentHtml = article.content?.html || (typeof article.content === 'string' ? article.content : '');
  const description = extractTextFromHtml(contentHtml);

  return (
    <Card className="group h-full overflow-hidden rounded-2xl transition-shadow duration-200 hover:shadow-lg flex flex-col">
      <Link to={`/knowledge-base/pages/${article.slug}`} className="block">
        <div className="aspect-[20/9] w-full overflow-hidden">
          {article.header_image_url ? (
            <img
              src={article.header_image_url}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <FileText className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>
      <div className="p-3 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
          <Link to={`/knowledge-base/pages/${article.slug}`} className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:underline">{article.title}</h3>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(article)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDelete(article)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex-grow">
          <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
            {description}
          </p>
          {article.tags && article.tags.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-primary/80 line-clamp-2">
                {article.tags.map(tag => `#${tag.name}`).join(' ')}
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-3 border-t flex justify-between items-center">
          {article.creator ? (
            <div className="flex items-center space-x-2 min-w-0">
              <Avatar className="h-6 w-6">
                <AvatarImage src={article.creator.avatar_url} alt={article.creator.name} />
                <AvatarFallback className="text-xs">{article.creator.initials}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">{article.creator.name}</span>
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    </Card>
  );
}