import React from "react";
import { Link } from "react-router-dom";
import { KbArticle } from "@/types";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  return (
    <Link to={`/knowledge-base/articles/${article.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden rounded-2xl transition-shadow duration-200 group-hover:shadow-lg flex flex-col">
        {/* Image Section */}
        <div className="aspect-[4/3] w-full overflow-hidden">
          {article.header_image_url ? (
            <img
              src={article.header_image_url}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <FileText className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-base leading-snug">{article.title}</h3>
          </div>
          
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-grow">
            {description}
          </p>

          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="secondary" className="rounded-full" asChild>
              {/* The button is part of the link, but styled to look interactive */}
              <span className="cursor-pointer">View</span>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}