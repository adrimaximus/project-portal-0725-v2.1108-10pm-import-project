import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const ProjectReview = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    // In a real app, you'd send this to a server
    console.log({ rating, comment });
    toast({
      title: "Review Submitted",
      description: "Thank you for your feedback!",
    });
    // Reset form
    setRating(0);
    setComment("");
  };

  return (
    <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Project Review</h3>
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-2 block">Rating</label>
                    <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                        key={star}
                        className={cn(
                            "h-6 w-6 cursor-pointer",
                            (hoverRating || rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                        )}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        />
                    ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="review-comment" className="text-sm font-medium mb-2 block">Comment</label>
                    <Textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about your experience with this project..."
                    rows={4}
                    />
                </div>
                <Button onClick={handleSubmit}>Submit Review</Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
};

export default ProjectReview;