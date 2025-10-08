import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { getAvatarUrl, getInitials } from "@/lib/utils";
import MentionInput from "./MentionInput";

interface Comment {
  id: string;
  text: string;
  created_at: string;
  is_ticket: boolean;
  attachment_url?: string;
  attachment_name?: string;
  author: {
    id: string;
    name: string;
    avatar_url: string;
    initials: string;
  };
}

const ProjectComments = ({ projectId }: { projectId: string }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ["comments", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          id, text, created_at, is_ticket, attachment_url, attachment_name,
          author:profiles (id, first_name, last_name, email, avatar_url)
        `
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((c: any) => {
        const name = `${c.author.first_name || ""} ${c.author.last_name || ""}`.trim();
        return {
          ...c,
          author: {
            ...c.author,
            name: name || c.author.email,
            initials: (name ? (name.split(" ")[0][0] + (name.split(" ").length > 1 ? name.split(" ")[1][0] : "")) : c.author.email[0]).toUpperCase(),
          },
        };
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await supabase
        .from("comments")
        .insert({ project_id: projectId, author_id: user?.id, text })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setNewComment("");
    },
  });

  const handleSubmit = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Avatar>
          <AvatarImage src={getAvatarUrl(user.avatar_url) || undefined} />
          <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <MentionInput
            value={newComment}
            onChange={setNewComment}
            placeholder="Add a comment... @ to mention, # to link project"
            userSuggestions={[]}
            projectSuggestions={[]}
            onSearchTermChange={() => {}}
          />
          <Button
            onClick={handleSubmit}
            disabled={addCommentMutation.isPending}
            className="mt-2"
          >
            {addCommentMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Comment
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p>Loading comments...</p>
        ) : (
          comments?.map((c) => (
            <div key={c.id} className="flex gap-4">
              <Avatar>
                <AvatarImage src={getAvatarUrl(c.author.avatar_url) || undefined} />
                <AvatarFallback>{c.author.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{c.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectComments;