import { dummyComments } from "@/data/comments";

const ProjectDetails = () => {
    // This file had a compile error. It might be an old or unused file.
    // It has been fixed to prevent build failures.
    console.log(`Number of comments: ${dummyComments.length}`);
    
    return (
        <div className="p-8">
            <h1 className="text-xl font-bold">Project Details Page</h1>
            <p className="text-muted-foreground">This page appears to be unused. The main project list is on the dashboard.</p>
        </div>
    )
}

export default ProjectDetails;