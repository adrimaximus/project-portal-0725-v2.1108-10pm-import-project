import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

type Comment = {
  text: string;
  file: File | null;
  fileURL?: string;
  sender: string;
  avatar: string;
};

const RequestComments = () => {
  return null;

  /*
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentComment, setCurrentComment] = useState("");
  const [commentFile, setCommentFile] = useState<File | null>(null);

  useEffect(() => {
    return () => {
      comments.forEach(comment => {
        if (comment.fileURL) {
          URL.revokeObjectURL(comment.fileURL);
        }
      });
    };
  }, [comments]);

  const handleSendComment = () => {
    if (currentComment.trim() === "" && !commentFile) return;

    const newComment: Comment = {
      text: currentComment,
      file: commentFile,
      fileURL: commentFile ? URL.createObjectURL(commentFile) : undefined,
      sender: "You",
      avatar: "https://github.com/shadcn.png",
    };

    setComments([...comments, newComment]);
    setCurrentComment("");
    setCommentFile(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comments.map((comment, index) => (
            <div key={index} className="flex items-start gap-3">
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={comment.avatar} alt={comment.sender} />
                <AvatarFallback>{comment.sender.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-semibold">{comment.sender}</p>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg mt-1">
                  <p className="whitespace-pre-wrap">{comment.text}</p>
                  {comment.file && comment.fileURL && (
                    <a
                      href={comment.fileURL}
                      download={comment.file.name}
                      className="mt-2 block rounded-lg border p-2 transition-colors hover:bg-muted"
                    >
                      {comment.file.type.startsWith("image/") ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={comment.fileURL}
                            alt="Image thumbnail"
                            className="h-12 w-12 rounded-md object-cover"
                          />
                          <div className="text-sm">
                            <p className="font-medium text-primary">{comment.file.name}</p>
                            <p className="text-xs text-muted-foreground">Click to download</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-background">
                            <Paperclip className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-medium text-primary">{comment.file.name}</p>
                            <p className="text-xs text-muted-foreground">Click to download</p>
                          </div>
                        </div>
                      )}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="relative">
            <Label htmlFor="comments" className="sr-only">Add a comment</Label>
            <Textarea
              id="comments"
              placeholder="Type your comment here..."
              className="resize-none pr-24 min-h-[80px]"
              value={currentComment}
              onChange={(e) => setCurrentComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
            />
            <div className="absolute bottom-2 right-2 flex items-center">
              <Input
                id="comment-attachment"
                type="file"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files ? e.target.files[0] : null;
                  setCommentFile(file);
                }}
              />
              <Button asChild variant="ghost" size="icon">
                <Label htmlFor="comment-attachment" className="cursor-pointer">
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">Attach file</span>
                </Label>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSendComment} disabled={!currentComment.trim() && !commentFile}>
                <Send className="h-5 w-5" />
                <span className="sr-only">Send comment</span>
              </Button>
            </div>
          </div>
          {commentFile && (
            <p className="text-sm text-muted-foreground pt-2">
              File to attach: {commentFile.name}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
  */
};

export default RequestComments;