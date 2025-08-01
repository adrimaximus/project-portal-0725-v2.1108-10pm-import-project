import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const ProjectReviewForm = () => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const handleRating = (rate: number) => {
    setRating(rate);
  };

  const handleSubmit = () => {
    if (rating === 0 || comment.trim() === "") {
      toast({
        title: "Incomplete Review",
        description: "Please provide a rating and a comment.",
        variant: "destructive",
      });
      return;
    }
    // Handle submission logic here
    console.log({ rating, comment });
    toast({
      title: "Review Submitted",
      description: "Thank you for your feedback!",
    });
    setRating(0);
    setComment("");
  };

  return (
    <Card className="mt-6 bg-slate-50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Project Review</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Rating</label>
            <div className="flex items-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-6 w-6 cursor-pointer transition-colors",
                    rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-gray-400"
                  )}
                  onClick={() => handleRating(star)}
                />
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="review-comment" className="text-sm font-medium">Comment</label>
            <Textarea
              id="review-comment"
              placeholder="Tell us about your experience with this project..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2 min-h-[100px]"
            />
          </div>
          <Button onClick={handleSubmit} size="sm">Submit Review</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectReviewForm;