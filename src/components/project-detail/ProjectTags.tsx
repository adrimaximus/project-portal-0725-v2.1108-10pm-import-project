import { Project, Tag, User, Reaction } from '@/types';
import { Badge } from '@/components/ui/badge';
import { TagsMultiselect } from '@/components/ui/TagsMultiselect';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { colors } from '@/data/colors';
import ProjectReactions from './ProjectReactions';

interface ProjectTagsProps {
  project: Project;
  isEditing: boolean;
  onTagsChange: (tags: Tag[]) => void;
  onReactionsChange: (reactions: Reaction[]) => void;
}

const ProjectTags = ({ project, isEditing, onTagsChange, onReactionsChange }: ProjectTagsProps) => {
  const { user } = useAuth();
  const [allTags, setAllTags] = useState<Tag[]>([]);

  const fetchTags = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('tags').select('*').or(`user_id.eq.${user.id},user_id.is.null`);
    if (data) setAllTags(data);
  }, [user]);

  useEffect(() => {
    if (isEditing) {
      fetchTags();
    }
  }, [isEditing, fetchTags]);

  const handleTagCreate = (tagName: string): Tag => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newTag: Tag = { id: uuidv4(), name: tagName, color: randomColor, isNew: true, user_id: user!.id };
    setAllTags(prev => [...prev, newTag]);
    return newTag;
  };

  if (!isEditing) {
    return (
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-wrap gap-2 flex-grow">
          {project.tags && project.tags.length > 0 ? (
            project.tags.map(tag => (
              <Badge
                key={tag.id}
                variant="outline"
                style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No tags assigned.</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <ProjectReactions project={project} onReactionsChange={onReactionsChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex-grow">
        <TagsMultiselect
          options={allTags}
          value={project.tags || []}
          onChange={onTagsChange}
          onTagCreate={handleTagCreate}
        />
      </div>
      <div className="flex-shrink-0">
        <ProjectReactions project={project} onReactionsChange={onReactionsChange} />
      </div>
    </div>
  );
};

export default ProjectTags;