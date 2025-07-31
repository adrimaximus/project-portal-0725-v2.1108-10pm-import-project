import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { User } from '@/data/projects';

interface Comment {
    id: string;
    user: { name: string; avatar: string; };
    timestamp: string;
    text: string;
    isTicket?: boolean;
    projectId: string;
}

interface ProjectCommentsProps {
    initialComments: Comment[];
}

const ProjectComments = ({ initialComments }: ProjectCommentsProps) => {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState('');

    const handleAddComment = () => {
        if (newComment.trim()) {
            const comment: Comment = {
                id: `comment-${Date.now()}`,
                user: { name: 'Current User', avatar: 'https://github.com/shadcn.png' },
                timestamp: new Date().toISOString(),
                text: newComment,
                projectId: initialComments[0]?.projectId || ''
            };
            setComments([comment, ...comments]);
            setNewComment('');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Feed & Tickets</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div>
                        <Textarea
                            placeholder="Add a comment or create a ticket..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="mt-2 flex justify-end">
                            <Button onClick={handleAddComment}>Post Comment</Button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-4">
                                <Avatar>
                                    <AvatarImage src={comment.user.avatar} />
                                    <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="w-full">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{comment.user.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProjectComments;