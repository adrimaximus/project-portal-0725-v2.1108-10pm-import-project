// @ts-nocheck
import { openai } from '../lib/clients.ts';
import { fetchContext } from '../lib/context.ts';
import { handleAction } from '../lib/action-handler.ts';

export const handleAnalyzeProjects = async (payload, { userSupabase, user }) => {
  const { request, conversationHistory } = payload;
  if (!request) throw new Error("An analysis request type is required.");

  const context = await fetchContext(userSupabase);
  const { summarizedProjects, summarizedGoals, userList, serviceList, iconList } = context;

  const today = new Date().toISOString();
  const systemPrompt = `You are an expert project and goal management AI assistant. You can answer questions and perform actions based on user requests. You will receive a conversation history. Use it to understand the context of the user's latest message.
Today's date is ${today}.

AVAILABLE ACTIONS:
You can perform several types of actions. When asked to perform an action, you MUST respond ONLY with a JSON object in the specified format.

1. CREATE_PROJECT:
{"action": "CREATE_PROJECT", "project_details": {"name": "<project name>", "description": "<desc>", "start_date": "YYYY-MM-DD", "due_date": "YYYY-MM-DD", "venue": "<venue>", "budget": 12345, "services": ["Service 1"], "members": ["User Name"]}}
- The current user will be the project owner. 'members' are additional people to add to the project.
- If the user does not explicitly list services, you MUST analyze the project name and description to infer a list of relevant services from the 'Available Services' context and include them in the 'services' array. For example, a 'gala dinner' project might need 'Venue', 'Food & Beverage', and 'Entertainment'.

2. UPDATE_PROJECT:
{"action": "UPDATE_PROJECT", "project_name": "<project name>", "updates": {"field": "value", "another_field": "value"}}
- Valid fields for 'updates' are: name, description, status, payment_status, budget, start_date, due_date, venue, add_members, remove_members, add_services, remove_services.

3. CREATE_TASK:
{"action": "CREATE_TASK", "project_name": "<project name>", "task_title": "<title of the new task>", "assignees": ["<optional user name>"]}

4. ASSIGN_TASK:
{"action": "ASSIGN_TASK", "project_name": "<project name>", "task_title": "<title of the task>", "assignees": ["<user name 1>", "<user name 2>"]}

5. UNASSIGN_TASK:
{"action": "UNASSIGN_TASK", "project_name": "<project name>", "task_title": "<title of the task>", "assignees": ["<user name 1>"]}

6. CREATE_GOAL:
{"action": "CREATE_GOAL", "goal_details": {"title": "<goal title>", "description": "<desc>", "type": "<type>", "frequency": "<freq>", "specific_days": ["Mo", "We"], "target_quantity": 123, "target_period": "Weekly", "target_value": 123, "unit": "USD", "icon": "IconName", "color": "#RRGGBB", "tags": [{"name": "Tag1", "color": "#RRGGBB"}]}}
- If a user provides only a title for a new goal, you MUST infer the other details.
- Infer a suitable 'description'.
- Choose an appropriate 'type' ('frequency', 'quantity', or 'value').
- Suggest a relevant 'icon' from the 'Available Icons' list and a suitable 'color'.
- Create 2-3 relevant 'tags' as an array of objects like '[{"name": "Health", "color": "#FF6B6B"}, ...]'. These will be new tags.
- Example: User says "create a goal to learn guitar". You might respond with: {"action": "CREATE_GOAL", "goal_details": {"title": "Learn Guitar", "description": "Practice guitar regularly to improve skills.", "type": "frequency", "frequency": "Weekly", "specific_days": ["Mo", "We", "Fr"], "icon": "Music", "color": "#4ECDC4", "tags": [{"name": "Music", "color": "#4ECDC4"}, {"name": "Hobby", "color": "#F7B801"}]}}

7. UPDATE_GOAL:
{"action": "UPDATE_GOAL", "goal_title": "<title of the goal to update>", "updates": {"field": "value", "another_field": "value"}}
- Valid fields for 'updates' are: title, description, type, frequency, specific_days, target_quantity, target_period, target_value, unit, icon, color, add_tags, remove_tags.
- For 'add_tags' and 'remove_tags', the value should be an array of tag names.

If the user's request is a question and not an action, answer it based on the provided data.

CONTEXT:
- Available Projects (with their tasks): ${JSON.stringify(summarizedProjects, null, 2)}
- Available Goals: ${JSON.stringify(summarizedGoals, null, 2)}
- Available Users: ${JSON.stringify(userList, null, 2)}
- Available Services: ${JSON.stringify(serviceList, null, 2)}
- Available Icons: ${JSON.stringify(iconList, null, 2)}
`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...(conversationHistory || []).map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.content })),
    { role: "user", content: request }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages,
    temperature: 0.1,
    max_tokens: 1000,
  });

  const responseText = response.choices[0].message.content;
  
  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
    if (!jsonMatch) return responseText;
    
    const jsonString = jsonMatch[1] || jsonMatch[2];
    const actionData = JSON.parse(jsonString);
    
    return await handleAction(actionData, context, user);
  } catch (e) {
    // If parsing or action handling fails, return the raw text response
    return responseText;
  }
};