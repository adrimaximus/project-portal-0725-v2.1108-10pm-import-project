import { useState } from 'react';
import { Project } from '@/data/projects';
import { Comment, initialComments } from '@/data/comments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import StarRating from '@/components/ui/StarRating';
import { format, parseISO, isAfter } from 'date-fns';

interface ProjectActivityTabProps {
  project: Project;
}

const isProjectDone = (project: Project) => {
  try {
    const now = new Date();
    const deadline = parseISO(project.deadline);
    return isAfter(now, deadline);
  } catch (error) {
    return false;
  }
};

const ProjectActivityTab = ({ project }: ProjectActivityTabProps) => {
  const [comments, setComments] = useState<Comment[]>(
    initialComments.filter((c) => c.projectId === project.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  );
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(project.rating || 0);
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(!!project.rating);

  const projectIsDone = isProjectDone(project);

  const handlePostComment = () => {
    if (newComment.trim()) {
      const commentToAdd: Comment = {
        id: `c${Date.now()}`,
        projectId: project.id,
        user: { name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=alex' }, // Placeholder user
        timestamp: new Date().toISOString(),
        text: newComment,
      };
      setComments([commentToAdd, ...comments]);
      setNewComment('');
    }
  };

  const handleSubmitRating = () => {
    // Here you would typically save the rating to your backend
    console.log(`Rating submitted for project ${project.id}: ${rating}`);
    setIsRatingSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {projectIsDone && (
        <Card>
          <CardHeader>
            <CardTitle>{isRatingSubmitted ? 'Terima Kasih Atas Ulasan Anda!' : 'Beri Peringkat Proyek Ini'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {isRatingSubmitted ? 'Peringkat Anda telah dikirimkan.' : 'Proyek ini telah selesai. Mohon berikan masukan Anda dengan memberikan peringkat.'}
            </p>
            <StarRating value={rating} onValueChange={setRating} isReadOnly={isRatingSubmitted} />
          </CardContent>
          {!isRatingSubmitted && (
            <CardFooter>
              <Button onClick={handleSubmitRating} disabled={rating === 0}>Kirim Peringkat</Button>
            </CardFooter>
          )}
        </Card>
      )}

      <div>
        <h4 className="font-semibold mb-4">Aktivitas</h4>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/150?u=alex" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Tambahkan komentar..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handlePostComment} disabled={!newComment.trim()}>Kirim</Button>
              </div>
            </div>
          </div>

          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 pt-4">
              <Avatar>
                <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                <AvatarFallback>{comment.user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="w-full">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{comment.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(comment.timestamp), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectActivityTab;