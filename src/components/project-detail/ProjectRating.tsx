"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ProjectRating = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    // Di aplikasi sungguhan, Anda akan mengirim data ini ke server
    console.log({ rating, comment });
    // Anda bisa menampilkan notifikasi toast di sini
    alert("Terima kasih atas masukan Anda!");
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card text-card-foreground p-4 shadow">
        <h4 className="font-semibold text-lg">Ulasan Proyek</h4>
        <div className="space-y-2">
            <Label>Rating Anda</Label>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={cn(
                    "h-7 w-7 cursor-pointer transition-colors",
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
        <div className="space-y-2">
            <Label htmlFor="comment">Komentar Anda</Label>
            <Textarea
                id="comment"
                placeholder="Ceritakan pengalaman Anda dengan proyek ini..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
            />
        </div>
        <Button onClick={handleSubmit} disabled={rating === 0 || !comment.trim()}>
            Kirim Ulasan
        </Button>
    </div>
  );
};

export default ProjectRating;