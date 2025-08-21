// @ts-nocheck
// This file will act as a router for different actions.
// For now, we'll keep it simple and add more complex actions later.

export async function executeAction(actionData, context) {
    const { userSupabase, user, projects, users, goals } = context;

    switch (actionData.action) {
        case 'CREATE_TASK': {
            const { project_name, task_title, assignees } = actionData;
            
            let project = projects.find(p => p.name.toLowerCase() === project_name.toLowerCase());
            if (!project) {
                const possibleMatches = projects.filter(p => p.name.toLowerCase().includes(project_name.toLowerCase()));
                if (possibleMatches.length === 1) project = possibleMatches[0];
                else if (possibleMatches.length > 1) return `I found multiple projects matching "${project_name}". Please be more specific.`;
            }
            if (!project) return `I couldn't find a project named "${project_name}".`;

            const { data: newTask, error: taskError } = await userSupabase.from('tasks').insert({
                project_id: project.id,
                title: task_title,
                created_by: user.id,
            }).select().single();

            if (taskError) return `I failed to create the task. The database said: ${taskError.message}`;

            let assignmentMessage = "";
            if (assignees && assignees.length > 0) {
                const userIdsToAssign = users
                    .filter(u => assignees.some(name => `${u.first_name} ${u.last_name}`.toLowerCase() === name.toLowerCase() || u.email.toLowerCase() === name.toLowerCase()))
                    .map(u => u.id);
                
                if (userIdsToAssign.length > 0) {
                    const newAssignees = userIdsToAssign.map(uid => ({ task_id: newTask.id, user_id: uid }));
                    const { error: assignError } = await userSupabase.from('task_assignees').insert(newAssignees);
                    if (assignError) assignmentMessage = ` but couldn't assign it: ${assignError.message}`;
                    else assignmentMessage = ` and assigned it to ${assignees.join(', ')}`;
                } else {
                    assignmentMessage = ` but couldn't find the user(s) to assign.`;
                }
            }
            return `Done! I've added the task "${task_title}" to "${project.name}"${assignmentMessage}.`;
        }
        // Other actions like CREATE_PROJECT, UPDATE_PROJECT will be added here.
        default:
            return "I'm not sure how to perform that action. Can you clarify?";
    }
}