import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Goal, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, MoreVertical, Copy } from 'lucide-react';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import GoalCollaborationManager from '@/components/goals/GoalCollaborationManager';
import GoalIcon from '@/components/goals/GoalIcon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { format } from 'date-fns';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import GoalQuantityTracker from '@/components/goals/GoalQuantityTracker';
import GoalValueTracker from '@/components/goals/GoalValueTracker';
import { formatNumber, formatValue } from '@/lib/formatting';
import GoalProgressChart from '@/components/goals/GoalProgressChart';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const fetchGoalBySlug = async (slug: string): Promise<Goal | null> => {
  const { data, error } = await supabase
    .rpc('get_goal_by_slug', { p_slug: slug })
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error("Error fetching goal details:", error);
    throw new Error(error.message);
  }
  return data as Goal | null;
};

const GoalDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: goal, isLoading, error: queryError } = useQuery({
    queryKey: ['goal', slug],
    queryFn: () => fetchGoalBySlug(slug!),
    enabled: !!slug && !!currentUser,
  });

  useEffect(() => {
    if (!isLoading && !goal) {
      toast.error('Goal not found or you do not have access.');
      navigate('/goals');
    }
  }, [isLoading, goal, navigate]);

  const uploadGoalAttachment = async (file: File) => {
    if (!currentUser || !goal) return null;
    const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = `goal-attachments/${goal.id}/${Date.now()}-${sanitizedFileName}`;
    
    const { error: uploadError } = await supabase.storage.from('goal-attachments').upload(filePath, file);
    if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);
    
    const { data: urlData } = supabase.storage.from('goal-attachments').getPublicUrl(filePath);
    return {
        url: urlData.publicUrl,
        name: file.name,
        type: file.type
    };
  };

  const handleUpdateCompletion = async (date: Date, value: number, file?: File | null, removeAttachment: boolean = false, note?: string) => {
    if (!goal || !currentUser) return;
    
    let attachmentData = null;
    if (file) {
        try {
            attachmentData = await uploadGoalAttachment(file);
        } catch (e: any) {
            toast.error("Failed to upload file. " + e.message);
            return;
        }
    }

    if (goal.type === 'frequency') {
        const dateString = format(date, 'yyyy-MM-dd');
        const existing = goal.completions.find(c => format(new Date(c.date), 'yyyy-MM-dd') === dateString);

        // Determine new value:
        // If explicitly passed value is different (e.g. from dialog checkbox), use it.
        // If no file/remove request and just toggling, switch 0/1.
        let newValue = value;
        
        // Prepare update data
        const upsertData: any = {
            goal_id: goal.id,
            user_id: currentUser.id,
            date: date.toISOString(),
            value: newValue,
            notes: note, // Include notes in the update payload
        };

        if (existing) upsertData.id = existing.id;
        
        if (attachmentData) {
            upsertData.attachment_url = attachmentData.url;
            upsertData.attachment_name = attachmentData.name;
            upsertData.attachment_type = attachmentData.type;
        } else if (removeAttachment) {
            upsertData.attachment_url = null;
            upsertData.attachment_name = null;
            upsertData.attachment_type = null;
        }

        const { error } = await supabase.from('goal_completions').upsert(upsertData, { onConflict: 'id' });

        if (error) {
            toast.error("Failed to update progress.");
        } else {
            toast.success(`Progress for ${format(date, 'PPP')} has been updated.`);
            queryClient.invalidateQueries({ queryKey: ['goal', slug] });
        }
    } else {
        // For Quantity/Value, we always insert a new log entry
        const insertData: any = {
            goal_id: goal.id,
            user_id: currentUser.id,
            date: date.toISOString(),
            value: value,
            notes: note, // Include notes in insert payload
        };
        
        if (attachmentData) {
            insertData.attachment_url = attachmentData.url;
            insertData.attachment_name = attachmentData.name;
            insertData.attachment_type = attachmentData.type;
        }

        const { error } = await supabase.from('goal_completions').insert(insertData);
        
        if (error) { 
            toast.error("Failed to log progress."); 
        } else { 
            toast.success("Progress logged successfully.");
            queryClient.invalidateQueries({ queryKey: ['goal', slug] }); 
        }
    }
  };

  const handleDeleteGoal = async () => {
    if (!goal) return;
    const { error } = await supabase.from('goals').delete().eq('id', goal.id);
    if (error) {
        toast.error("Failed to delete goal.");
    } else {
        toast.success(`Goal "${goal.title}" has been deleted.`);
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        navigate('/goals');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  const handleCollaboratorsUpdate = async (updatedCollaborators: User[]) => {
    if (!goal || !currentUser) return;
    const currentCollaboratorIds = new Set(goal.collaborators.map(c => c.id));
    const updatedCollaboratorIds = new Set(updatedCollaborators.map(c => c.id));

    const toAdd = updatedCollaborators.filter(c => !currentCollaboratorIds.has(c.id));
    const toRemove = goal.collaborators.filter(c => !updatedCollaboratorIds.has(c.id) && c.id !== currentUser.id);

    try {
      if (toRemove.length > 0) {
        const { error } = await supabase.from('goal_collaborators').delete().eq('goal_id', goal.id).in('user_id', toRemove.map(c => c.id));
        if (error) throw error;
      }
      if (toAdd.length > 0) {
        const { error } = await supabase.from('goal_collaborators').insert(toAdd.map(c => ({ goal_id: goal.id, user_id: c.id })));
        if (error) throw error;
      }
      toast.success("Collaborators updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update collaborators.", { description: error.message });
    } finally {
      queryClient.invalidateQueries({ queryKey: ['goal', slug] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  };

  if (isLoading || !goal) {
    return <PortalLayout><div className="text-center">Loading goal details...</div></PortalLayout>;
  }

  const getFrequencyText = () => {
    if (goal.type === 'quantity') {
      return `${formatNumber(goal.target_quantity!)} per ${goal.target_period}`;
    }
    if (goal.type === 'value') {
      return `Target: ${formatValue(goal.target_value!, goal.unit)}`;
    }
    if (goal.frequency === 'Daily') return 'Daily';
    if (goal.frequency === 'Weekly' && goal.specific_days && goal.specific_days.length > 0) {
      if (goal.specific_days.length === 7) return 'Daily';
      if (goal.specific_days.length === 2 && goal.specific_days.includes('Sa') && goal.specific_days.includes('Su')) return 'Weekends';
      if (goal.specific_days.length === 5 && !goal.specific_days.includes('Sa') && !goal.specific_days.includes('Su')) return 'Weekdays';
      return `Weekly on ${goal.specific_days.join(', ')}`;
    }
    return 'Weekly';
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/goals"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Goals</Link>
          </Button>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <GoalIcon goal={goal} className="h-16 w-16" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{goal.title}</h1>
                <p className="text-muted-foreground">{goal.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteGoal}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{getFrequencyText()}</Badge>
            {goal.tags.map(tag => (
              <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>

        {goal.type === 'frequency' && (
          <GoalYearlyProgress
            goal={goal}
            onToggleCompletion={(date) => handleUpdateCompletion(date, 1)}
            onUpdateCompletion={handleUpdateCompletion}
          />
        )}

        {(goal.type === 'quantity' || goal.type === 'value') && (
          <div className="space-y-6">
            <GoalProgressChart goal={goal} />
            {goal.type === 'quantity' ? (
              <GoalQuantityTracker goal={goal} onLogProgress={(date, val, file, remove, note) => handleUpdateCompletion(date, val, file, remove, note)} />
            ) : (
              <GoalValueTracker goal={goal} onLogValue={(date, val, file, remove, note) => handleUpdateCompletion(date, val, file, remove, note)} />
            )}
          </div>
        )}

        <GoalCollaborationManager goal={goal} onCollaboratorsUpdate={handleCollaboratorsUpdate} />
      </div>
      
      <GoalFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => setIsEditDialogOpen(false)}
        goal={goal}
      />
    </PortalLayout>
  );
};

export default GoalDetailPage;