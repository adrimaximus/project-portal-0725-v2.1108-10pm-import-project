import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import RichTextEditor from '@/components/RichTextEditor';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tag, KbFolder } from '@/types';
import { TagInput } from '@/components/goals/TagInput';
import { v4 as uuidv4 } from 'uuid';
import { colors } from '@/data/colors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const articleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  content: z.string().min(10, "Content is too short."),
  cover_image_url: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  tags: z.array(z.any()).optional(),
  folder_id: z.string().optional().nullable(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

const ArticleEditorPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(!!slug);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [folders, setFolders] = useState<KbFolder[]>([]);

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      content: '',
      cover_image_url: '',
      tags: [],
      folder_id: null,
    },
  });

  const fetchTags = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('tags').select('*').or(`user_id.eq.${user.id},user_id.is.null`);
    if (data) setAllTags(data);
  }, [user]);

  const fetchFolders = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_kb_folders_for_user');
    if (error) {
      toast.error("Could not load your folders.");
    } else {
      setFolders(data || []);
    }
  }, []);

  const fetchArticle = useCallback(async (slugToFetch: string) => {
    const { data, error } = await supabase
      .from('kb_articles')
      .select('id, title, content, cover_image_url, folder_id, kb_article_tags(tags(*))')
      .eq('slug', slugToFetch)
      .single();

    if (error || !data) {
      toast.error("Article not found.");
      navigate('/knowledge-base');
    } else {
      const fetchedTags = data.kb_article_tags.map((t: any) => t.tags);
      form.reset({
        title: data.title,
        content: data.content || '',
        cover_image_url: data.cover_image_url || '',
        tags: fetchedTags,
        folder_id: data.folder_id,
      });
      setArticleId(data.id);
      setCoverImagePreview(data.cover_image_url || null);
    }
    setIsLoading(false);
  }, [navigate, form]);

  useEffect(() => {
    fetchTags();
    fetchFolders();
    if (slug) {
      fetchArticle(slug);
    }
  }, [slug, fetchArticle, fetchTags, fetchFolders]);

  const handleTagCreate = (tagName: string): Tag => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newTag: Tag = { id: uuidv4(), name: tagName, color: randomColor, isNew: true };
    setAllTags(prev => [...prev, newTag]);
    return newTag;
  };

  const onSubmit = async (values: ArticleFormValues) => {
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    let finalCoverImageUrl = values.cover_image_url;

    if (coverImageFile) {
      const fileExt = coverImageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('kb-cover-images')
        .upload(filePath, coverImageFile);

      if (uploadError) {
        toast.error("Failed to upload cover image.", { description: uploadError.message });
        return;
      }

      const { data: urlData } = supabase.storage
        .from('kb-cover-images')
        .getPublicUrl(filePath);
      
      finalCoverImageUrl = urlData.publicUrl;
    } else if (!coverImagePreview) {
      finalCoverImageUrl = '';
    }

    const existingTagIds = (values.tags || []).filter(t => !t.isNew).map(t => t.id);
    const newCustomTags = (values.tags || []).filter(t => t.isNew).map(({ name, color }) => ({ name, color }));

    const { data, error } = await supabase.rpc('upsert_article_with_tags', {
      p_id: articleId,
      p_title: values.title,
      p_content: values.content,
      p_cover_image_url: finalCoverImageUrl,
      p_author_id: user.id,
      p_folder_id: values.folder_id === 'null' ? null : values.folder_id,
      p_existing_tag_ids: existingTagIds,
      p_custom_tags: newCustomTags,
    });

    if (error) {
      toast.error("Failed to save article.", { description: error.message });
    } else {
      toast.success(`Article ${articleId ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', data.slug] });
      navigate(`/knowledge-base/${data.slug}`);
    }
  };

  if (isLoading && slug) {
    return <PortalLayout><div>Loading editor...</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-6">
          <Link to={slug ? `/knowledge-base/${slug}` : "/knowledge-base"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-6">{slug ? 'Edit Article' : 'Create New Article'}</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a title for your article" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="folder_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'null'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder to assign this article to" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">No Folder (Private Draft)</SelectItem>
                      {folders.map(folder => (
                        <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      allTags={allTags}
                      selectedTags={field.value || []}
                      onTagsChange={field.onChange}
                      onTagCreate={handleTagCreate}
                      user={user}
                      onTagsUpdated={fetchTags}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cover_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image (Optional)</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCoverImageFile(file);
                            setCoverImagePreview(URL.createObjectURL(file));
                          }
                        }}
                        className="max-w-sm"
                      />
                      {coverImagePreview && (
                        <div className="mt-4 relative w-full max-w-md">
                          <img src={coverImagePreview} alt="Cover preview" className="w-full h-auto object-cover rounded-lg border" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => {
                              setCoverImageFile(null);
                              setCoverImagePreview(null);
                              field.onChange('');
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Start writing your article here..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {slug ? 'Save Changes' : 'Publish Article'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PortalLayout>
  );
};

export default ArticleEditorPage;