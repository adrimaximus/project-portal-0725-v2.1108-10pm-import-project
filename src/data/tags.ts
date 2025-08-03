export interface Tag {
    id: string;
    name: string;
    color: string; // hex color
}

export const dummyTags: Tag[] = [
    { id: 'tag-1', name: 'Learning', color: '#3B82F6' },
    { id: 'tag-2', name: 'Personal Growth', color: '#10B981' },
    { id: 'tag-3', name: 'Health', color: '#EF4444' },
    { id: 'tag-4', name: 'Fitness', color: '#F97316' },
    { id: 'tag-5', name: 'Cardio', color: '#F59E0B' },
    { id: 'tag-6', name: 'Music', color: '#8B5CF6' },
    { id: 'tag-7', name: 'Hobby', color: '#EC4899' },
    { id: 'tag-8', name: 'Skill', color: '#6366F1' },
    { id: 'tag-9', name: 'Hydration', color: '#0EA5E9' },
    { id: 'tag-10', name: 'Mindfulness', color: '#14B8A6' },
    { id: 'tag-11', name: 'Mental Health', color: '#D946EF' },
];