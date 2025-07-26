import React from 'react';

export interface Comment {
    id: string;
    projectId: string;
    author: string;
    avatar: string;
    text: string;
    timestamp: string;
    isTicket: boolean;
}

interface ProjectCommentsProps {
    comments: Comment[];
    setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
    projectId: string;
}

const ProjectComments: React.FC<ProjectCommentsProps> = ({ comments, setComments, projectId }) => {
    return (
        <div>
            {/* Placeholder for comments implementation */}
        </div>
    );
};

export default ProjectComments;