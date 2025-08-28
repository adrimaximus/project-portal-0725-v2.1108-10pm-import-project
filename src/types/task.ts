export interface TaskAssignee {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    due_date: string | null;
    priority: string | null;
    project_id: string;
    projects: {
        id: string;
        name: string;
        slug: string;
        status: string;
        created_by: string | null;
    } | null;
    assignees: TaskAssignee[];
    created_by: TaskAssignee | null;
    created_at: string;
}