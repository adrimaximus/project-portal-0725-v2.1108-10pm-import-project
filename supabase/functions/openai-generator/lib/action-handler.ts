// @ts-nocheck
import { supabaseAdmin } from './clients.ts';

export const handleAction = async (actionData, context, user) => {
  const { action } = actionData;
  const { userList, rawProjects, rawGoals } = context;

  switch (action) {
    case 'CREATE_PROJECT': {
      const { project_details } = actionData;
      if (!project_details || !project_details.name) return "To create a project, I need at least a name.";

      const { data: newProject, error: projectInsertError } = await supabaseAdmin
        .from('projects')
        .insert({
          name: project_details.name,
          description: project_details.description,
          start_date: project_details.start_date,
          due_date: project_details.due_date,
          venue: project_details.venue,
          budget: project_details.budget,
          created_by: user.id,
          status: 'Requested',
        })
        .select()
        .single();

      if (projectInsertError) return `I tried to create the project, but failed. The database said: ${projectInsertError.message}`;

      const newProjectId = newProject.id;
      let followUpMessages = [];

      if (project_details.services && project_details.services.length > 0) {
        const servicesToInsert = project_details.services.map(serviceTitle => ({ project_id: newProjectId, service_title: serviceTitle }));
        const { error: servicesError } = await supabaseAdmin.from('project_services').insert(servicesToInsert);
        if (servicesError) followUpMessages.push("I couldn't add the services due to an error.");
        else followUpMessages.push(`I've added ${project_details.services.length} services.`);
      }

      if (project_details.members && project_details.members.length > 0) {
        const memberIdsToAssign = userList.filter(u => project_details.members.some(name => u.name.toLowerCase() === name.toLowerCase())).map(u => u.id);
        if (memberIdsToAssign.length > 0) {
          const membersToInsert = memberIdsToAssign.map(userId => ({ project_id: newProjectId, user_id: userId, role: 'member' }));
          const { error: membersError } = await supabaseAdmin.from('project_members').insert(membersToInsert);
          if (membersError) followUpMessages.push("I couldn't add the team members due to an error.");
          else followUpMessages.push(`I've assigned ${project_details.members.join(', ')} to the project.`);
        } else {
          followUpMessages.push(`I couldn't find the users ${project_details.members.join(', ')} to assign.`);
        }
      }

      let finalMessage = `Done! I've created the project "${newProject.name}".`;
      if (followUpMessages.length > 0) finalMessage += " " + followUpMessages.join(' ');
      return finalMessage;
    }

    case 'UPDATE_PROJECT': {
        const { project_name, updates } = actionData;
        const project = rawProjects.find(p => p.name.toLowerCase() === project_name.toLowerCase());
        if (!project) return `I couldn't find a project named "${project_name}". Please be more specific.`;

        const rpcParams = {
            p_project_id: project.id,
            p_name: updates.name !== undefined ? updates.name : project.name,
            p_description: updates.description !== undefined ? updates.description : (project.description || null),
            p_category: updates.category !== undefined ? updates.category : (project.category || null),
            p_status: updates.status !== undefined ? updates.status : project.status,
            p_budget: updates.budget !== undefined ? updates.budget : (project.budget || null),
            p_start_date: updates.start_date !== undefined ? updates.start_date : (project.start_date || null),
            p_due_date: updates.due_date !== undefined ? updates.due_date : (project.due_date || null),
            p_payment_status: updates.payment_status !== undefined ? updates.payment_status : project.payment_status,
            p_payment_due_date: updates.payment_due_date !== undefined ? updates.payment_due_date : (project.payment_due_date || null),
            p_venue: updates.venue !== undefined ? updates.venue : (project.venue || null),
            p_member_ids: project.assignedTo.map(m => m.id),
            p_service_titles: project.services || [],
        };

        let currentMemberIds = new Set(project.assignedTo.map(m => m.id));
        if (updates.add_members) updates.add_members.forEach(name => { const u = userList.find(u => u.name.toLowerCase() === name.toLowerCase()); if (u) currentMemberIds.add(u.id); });
        if (updates.remove_members) updates.remove_members.forEach(name => { const u = userList.find(u => u.name.toLowerCase() === name.toLowerCase()); if (u) currentMemberIds.delete(u.id); });
        rpcParams.p_member_ids = Array.from(currentMemberIds);

        let currentServices = new Set(project.services || []);
        if (updates.add_services) updates.add_services.forEach(service => currentServices.add(service));
        if (updates.remove_services) updates.remove_services.forEach(service => currentServices.delete(service));
        rpcParams.p_service_titles = Array.from(currentServices);

        const { error: updateError } = await supabaseAdmin.rpc('update_project_details', rpcParams);
        if (updateError) return `I tried to update the project, but failed. The database said: ${updateError.message}`;
        
        const changes = Object.entries(updates).map(([key, value]) => {
            switch (key) {
                case 'name': return `renamed it to "${value}"`;
                case 'status': return `changed the status to "${value}"`;
                case 'add_members': return `added ${value.join(', ')} to the team`;
                // Add more descriptive changes here
                default: return `updated the ${key.replace('_', ' ')}`;
            }
        });
        return `Done! For the project "${project.name}", I've ${changes.join(' and ')}.`;
    }

    case 'CREATE_TASK': {
        const { project_name, task_title, assignees } = actionData;
        const project = rawProjects.find(p => p.name.toLowerCase() === project_name.toLowerCase());
        if (!project) return `I couldn't find a project named "${project_name}" to add the task to.`;

        const { data: newTask, error: taskError } = await supabaseAdmin.from('tasks').insert({ project_id: project.id, title: task_title, created_by: user.id }).select().single();
        if (taskError) return `I tried to create the task, but failed: ${taskError.message}`;

        let assignmentMessage = "";
        if (assignees && assignees.length > 0) {
            const userIdsToAssign = userList.filter(u => assignees.some(name => u.name.toLowerCase() === name.toLowerCase())).map(u => u.id);
            if (userIdsToAssign.length > 0) {
                const newAssignees = userIdsToAssign.map(uid => ({ task_id: newTask.id, user_id: uid }));
                const { error: assignError } = await supabaseAdmin.from('task_assignees').insert(newAssignees);
                if (assignError) assignmentMessage = ` but couldn't assign it: ${assignError.message}`;
                else assignmentMessage = ` and assigned it to ${assignees.join(', ')}`;
            } else {
                assignmentMessage = ` but couldn't find the user(s) to assign.`;
            }
        }
        return `OK, I've added the task "${task_title}" to "${project.name}"${assignmentMessage}.`;
    }

    case 'CREATE_GOAL': {
        const { goal_details } = actionData;
        if (!goal_details || !goal_details.title) return "To create a goal, I need at least a title.";

        const { data: newGoal, error: rpcError } = await supabaseAdmin
            .rpc('create_goal_and_link_tags', {
                p_title: goal_details.title,
                p_description: goal_details.description,
                p_icon: goal_details.icon,
                p_color: goal_details.color,
                p_type: goal_details.type,
                p_frequency: goal_details.frequency,
                p_specific_days: goal_details.specific_days,
                p_target_quantity: goal_details.target_quantity,
                p_target_period: goal_details.target_period,
                p_target_value: goal_details.target_value,
                p_unit: goal_details.unit,
                p_existing_tags: [],
                p_custom_tags: goal_details.tags || [],
            })
            .single();

        if (rpcError) return `I tried to create the goal, but failed: ${rpcError.message}`;
        return `Done! I've created the new goal: "${newGoal.title}".`;
    }

    // Add other action handlers here...

    default:
      return `I'm not sure how to perform the action: ${action}.`;
  }
};