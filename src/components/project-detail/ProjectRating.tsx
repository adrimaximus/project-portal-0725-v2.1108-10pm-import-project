"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import StarRatingDisplay from "./StarRatingDisplay";

interface ProjectRatingProps {
  submittedRating?: number;
  submittedComment?: string;
  onSubmit: (rating: number, comment: string) => void;
}

const ProjectRating = ({ submittedRating, submittedComment, onSubmit }: ProjectRatingProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    onSubmit(rating, comment);
  };

  // Display view: if a rating has been submitted
  if (submittedRating) {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Rating</Label>
          <StarRatingDisplay rating={submittedRating} />
        </div>
        {submittedComment && (
          <div className="space-y-1.5">
            <Label>Comment</Label>
            <p className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md whitespace-pre-wrap border">
              {submittedComment}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Form view: if no rating has been submitted yet
  return (
    <div className="space-y-3 rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
        <h4 className="font-semibold">Project Review</h4>
        <div className="space-y-1.5">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={cn(
                    "h-6 w-6 cursor-pointer transition-colors",
                    (hoverRating || rating) >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 hover:text-yellow-300"
                    )}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                />
                ))}
            </div>
        </div>
        <div className="space-y-1.5">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
                id="comment"
                placeholder="Tell us about your experience with this project..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px]"
            />
        </div>
        <Button onClick={handleSubmit} disabled={rating === 0 || !comment.trim()} size="sm">
            Submit Review
        </Button>
    </div>
  );
};

export default ProjectRating;