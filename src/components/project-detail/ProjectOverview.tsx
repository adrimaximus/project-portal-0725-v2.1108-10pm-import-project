import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project, AssignedUser } from "@/data/projects";
import { allUsers } from "@/data/users";
import { format } from "date-fns";
import { CalendarIcon, Edit, FileText, Paperclip, Plus, Trash2, X } from "lucide-react";
import { cn } from '@/lib/utils';
import RichTextEditor from '../RichTextEditor';
import TeamSelector from '../request/TeamSelector';

interface ProjectOverviewProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (team: AssignedUser[]) => void;
  onFilesChange: (files: File[]) => void;
}

const ProjectOverview = ({ project, isEditing, onDescriptionChange, onTeamChange, onFilesChange }: ProjectOverviewProps) => {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([
    { id: 1, user: { id: 'user-1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice' }, text: 'Can we get an update on the timeline?', timestamp: '2 hours ago' },
    { id: 2, user: { id: 'user-2', name: 'Bob Williams', avatar: 'https://i.pravatar.cc/150?u=bob' }, text: 'I\'ve pushed the latest changes to the dev branch.', timestamp: '1 hour ago' },
  ]);

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj = {
        id: Date.now(),
        user: { id: 'current-user', name: 'You', avatar: 'https://i.pravatar.cc/150?u=current', status: 'Offline' },
        text: newComment,
        timestamp: 'Just now',
      };
      // This type assertion is a bit of a hack for the demo data structure
      setComments([...comments, newCommentObj as any]);
      setNewComment('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            {isEditing ? (
              <RichTextEditor value={project.description} onChange={onDescriptionChange} />
            ) : (
              <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: project.description }} />
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Assigned Team</h3>
            {isEditing ? (
              <TeamSelector selectedUsers={project.assignedTo} onTeamChange={onTeamChange} />
            ) : (
              <div className="flex flex-wrap gap-4">
                {project.assignedTo.map(user => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Brief Files</h3>
            {isEditing ? (
              <div>
                {/* File upload logic would go here */}
                <p className="text-sm text-muted-foreground">File editing is not implemented in this view.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {project.briefFiles?.map((file, index) => (
                  <a key={index} href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer" className="group relative block border rounded-lg overflow-hidden">
                    <div className="aspect-w-1 aspect-h-1">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt={file.name} className="object-cover w-full h-full" />
                      ) : (
                        <div className="bg-muted flex items-center justify-center h-full">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-xs font-medium text-white truncate">{file.name}</p>
                    </div>
                  </a>
                ))}
                {(!project.briefFiles || project.briefFiles.length === 0) && (
                  <p className="text-sm text-muted-foreground col-span-full">No brief files attached.</p>
                )}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Activity & Comments</h3>
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                    <AvatarFallback>{comment.user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{comment.user.name}</p>
                      <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button onClick={handleAddComment}>Send</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectOverview;