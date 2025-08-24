import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon, X, Sparkles, ListCollapse } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';
import { KbFolder, KbArticle as Article } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UnsplashImagePicker from './UnsplashImagePicker';
import ReactQuill from 'react-quill';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ArticleValues {
  id?: string;
  title: string;
  content: any;
  folder_id: string;
  header_image_url?: string;
}

interface PageEditorDialogProps {
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

const PageEditorDialog = ({ open, onOpenChange, folders = [], folder, article, onSuccess }: PageEditorDialogProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!article;
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const editorRef = useRef<ReactQuill>(null);
  const [debouncedTitle, setDebouncedTitle] = useState('');

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      content: '',
      folder_id: '',
    }
  });

  const titleValue = form.watch('title');

  useEffect(() => {
    const handler = setTimeout(() => {
      if (titleValue) {
        setDebouncedTitle(titleValue);
      }
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [titleValue]);

  useEffect(() => {
    if (open) {
      if (article) {
        form.reset({
          title: article.title,
          content: article.content?.html || article.content || '',
          folder_id: article.folder_id,
        });
        setImagePreview(article.header_image_url || null);
      } else {
        form.reset({
          title: '',
          content: '',
          folder_id: folder?.id || '',
        });
        setImagePreview(null);
      }
      setImageFile(null);
      setIsRemovingImage(false);
    }
  }, [article, folder, open, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIsRemovingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setIsRemovingImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePexelsSelect = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setIsRemovingImage(false);
  };

  const handleImproveContent = async () => {
    const editor = editorRef.current?.getEditor();
    if (!editor) {
      toast.error("Editor is not ready.");
      return;
    }

    const title = form.getValues('title');
    const fullContent = form.getValues('content');
    const selection = editor.getSelection();
    const selectedText = selection ? editor.getText(selection.index, selection.length) : '';

    let feature: string;
    let payload: any;

    if (!fullContent || fullContent.trim() === '<p><br></p>' || fullContent.trim().length < 15) {
      if (!title.trim()) {
        toast.error("Please provide a title to generate a page.");
        return;
      }
      feature = 'generate-article-from-title';
      payload = { title };
      toast.info("Generating page from title...");
    } else if (selection && selection.length > 0 && selectedText.trim()) {
      feature = 'expand-article-text';
      payload = { title, fullContent, selectedText };
      toast.info("Expanding on your selected text...");
    } else {
      feature = 'improve-article-content';
      payload = { content: fullContent };
      toast.info("Improving the entire page...");
    }
    
    setIsImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-handler', {
        body: { feature, payload }
      });
      if (error) throw error;

      if (feature === 'expand-article-text' && selection) {
        editor.deleteText(selection.index, selection.length);
        editor.clipboard.dangerouslyPasteHTML(selection.index, data.result);
        form.setValue('content', editor.root.innerHTML, { shouldDirty: true });
      } else {
        form.setValue('content', data.result, { shouldDirty: true });
      }
      toast.success("Content updated by AI!");
    } catch (error: any) {
      toast.error("Failed to update content.", { description: error.message });
    } finally {
      setIsImproving(false);
    }
  };

  const handleSummarizeContent = async () => {
    const editor = editorRef.current?.getEditor();
    if (!editor) {
      toast.error("Editor is not ready.");
      return;
    }

    const title = form.getValues('title');
    const fullContent = form.getValues('content');
    const selection = editor.getSelection();
    const selectedText = selection ? editor.getText(selection.index, selection.length) : '';

    let payload: any;
    let isSelection = false;

    if (selection && selection.length > 0 && selectedText.trim()) {
      payload = { content: selectedText, fullArticleContent: fullContent, articleTitle: title };
      isSelection = true;
      toast.info("Summarizing selected text...");
    } else {
      if (!fullContent || fullContent.trim() === '<p><br></p>' || fullContent.trim().length < 50) {
        toast.error("There is not enough content to summarize.");
        return;
      }
      payload = { content: fullContent };
      toast.info("Summarizing the entire page...");
    }
    
    setIsSummarizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-handler', {
        body: { feature: 'summarize-article-content', payload }
      });
      if (error) throw error;

      if (isSelection && selection) {
        editor.deleteText(selection.index, selection.length);
        editor.clipboard.dangerouslyPasteHTML(selection.index, data.result);
        form.setValue('content', editor.root.innerHTML, { shouldDirty: true });
      } else {
        form.setValue('content', data.result, { shouldDirty: true });
      }
      toast.success("Content summarized by AI!");
    } catch (error: any) {
      toast.error("Failed to summarize content.", { description: error.message });
    } finally {
      setIsSummarizing(false);
    }
  };

  const onSubmit = async (values: ArticleFormValues) => {
    if (!user) {
        toast.error("You must be logged in.");
        return;
    }
    setIsSaving(true);
    
    let header_image_url = article?.header_image_url;

    if (imageFile) {
      const sanitizedFileName = imageFile.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const filePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;
      const { error: uploadError } = await supabase.storage.from('kb-images').upload(filePath, imageFile);
      if (uploadError) {
        toast.error("Failed to upload header image.", { description: uploadError.message });
        setIsSaving(false);
        return;
      }
      const { data } = supabase.storage.from('kb-images').getPublicUrl(filePath);
      header_image_url = data.publicUrl;
    } else if (isRemovingImage) {
      header_image_url = undefined;
    } else if (imagePreview && imagePreview !== article?.header_image_url) {
      header_image_url = imagePreview;
    }

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
            toast.error("Failed to manage default folder for the page.", { description: error.message });
            setIsSaving(false);
            return;
        }
    }

    if (!finalFolderId) {
        toast.error("Could not determine a folder for the page.");
        setIsSaving(false);
        return;
    }
    
    const articleData = {
      title: values.title,
      content: values.content ? { html: values.content } : null,
      folder_id: finalFolderId,
      header_image_url: header_image_url,
    };

    const promise = isEditMode && article?.id
      ? supabase.from('kb_articles').update(articleData).eq('id', article.id)
      : supabase.from('kb_articles').insert(articleData);

    const { error } = await promise;
    setIsSaving(false);

    if (error) {
      toast.error(`Failed to save page: ${error.message}`);
    } else {
      toast.success(`Page "${values.title}" saved successfully.`);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Page' : 'Create New Page'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? `Editing "${article?.title}". You can also move it to a different folder.`
              : 'Create a new page and assign it to a folder.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).nodeName !== 'TEXTAREA' && (e.target as HTMLElement).getAttribute('role') !== 'textbox') {
                e.preventDefault();
              }
            }}
            className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4"
          >
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormItem>
              <FormLabel>Header Image</FormLabel>
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-md" />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleRemoveImage}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Tabs defaultValue="upload" className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="pexels">Search Unsplash</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="pt-4">
                  <div
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Click to upload an image</p>
                    </div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="pexels">
                  <UnsplashImagePicker onImageFileSelect={handlePexelsSelect} initialSearchTerm={debouncedTitle} />
                </TabsContent>
              </Tabs>
            </FormItem>
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
                <div className="flex justify-between items-center">
                  <FormLabel>Content</FormLabel>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="outline" size="icon" onClick={handleImproveContent} disabled={isImproving || isSummarizing}>
                            {isImproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Improve or Expand</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="outline" size="icon" onClick={handleSummarizeContent} disabled={isImproving || isSummarizing}>
                            {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListCollapse className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Summarize</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <FormControl>
                  <RichTextEditor ref={editorRef} value={field.value || ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Page
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PageEditorDialog;