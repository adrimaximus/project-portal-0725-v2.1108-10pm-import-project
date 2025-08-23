import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';
import { KbFolder } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ArticleValues {
  id?: string;
  title: string;
  content: string;
  folder_id: string;
}

interface ArticleEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders?: KbFolder[];
  folder?: KbFolder | null;
  article?: ArticleValues | null;
  onSuccess: () => void;
}

const articleSchema = z.object({
  title: z.string().min(1, "Title is required."),
  content: z.string().min(10, "Content is too short.").optional().or(z.literal('')),
  folder_id: z.string().optional(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

const ArticleEditorDialog = ({ open, onOpenChange, folders = [], folder, article, onSuccess }: ArticleEditorDialogProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!article;
  const { user } = useAuth();

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      content: '',
      folder_id: '',
    }
  });

  useEffect(() => {
    if (open) {
      if (article) {
        form.reset({
          title: article.title,
          content: article.content || '',
          folder_id: article.folder_id,
        });
      } else {
        form.reset({
          title: '',
          content: '',
          folder_id: folder?.id || '',
        });
      }
    }
  }, [article, folder, open, form]);

  const onSubmit = async (values: ArticleFormValues) => {
    if (!user) {
        toast.error("You must be logged in.");
        return;
    }
    setIsSaving(true);
    
    let finalFolderId = values.folder_id;

    if (!isEditMode && !finalFolderId) {
        try {
            const { data: existingFolder, error: findError } = await supabase
                .from('kb_folders')
                .select('id')
                .eq('name', 'Uncategorized')
                .eq('user_id', user.id)
                .single();

            if (findError && findError.code !== 'PGRST116') throw findError;

            if (existingFolder) {
                finalFolderId = existingFolder.id;
            } else {
                const { data: newFolder, error: createError } = await supabase
                    .from('kb_folders')
                    .insert({ name: 'Uncategorized', icon: 'Archive', color: '#9ca3af', user_id: user.id })
                    .select('id')
                    .single();
                if (createError) throw createError;
                finalFolderId = newFolder!.id;
            }
        } catch (error: any) {
            toast.error("Failed to manage default folder.", { description: error.message });
            setIsSaving(false);
            return;
        }
    }

    if (!finalFolderId) {
        toast.error("Could not determine a folder for the article.");
        setIsSaving(false);
        return;
    }
    
    const articleData = {
      title: values.title,
      content: values.content ? JSON.parse(JSON.stringify(values.content)) : null,
      folder_id: finalFolderId,
    };

    const promise = isEditMode && article?.id
      ? supabase.from('kb_articles').update(articleData).eq('id', article.id)
      : supabase.from('kb_articles').insert(articleData);

    const { error } = await promise;
    setIsSaving(false);

    if (error) {
      toast.error(`Failed to save article: ${error.message}`);
    } else {
      toast.success(`Article "${values.title}" saved successfully.`);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Article' : 'Create New Article'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? `Editing "${article?.title}". You can also move it to a different folder.`
              : 'Create a new article and assign it to a folder.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField
              control={form.control}
              name="folder_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {folders.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="content" render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <RichTextEditor value={field.value || ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Article
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleEditorDialog;