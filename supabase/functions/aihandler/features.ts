// @ts-nocheck
import { buildContext } from './context.ts';
import { executeAction } from './actions.ts';
import * as pdfjs from 'https://esm.sh/pdfjs-dist@4.4.168';
import mammoth from 'https://esm.sh/mammoth@1.7.2';

const getAnalyzeProjectsSystemPrompt = (context, userName) => `You are an expert project and goal management AI assistant. Your purpose is to execute actions for the user. You will receive a conversation history and context data.

**Conversational Style:**
1.  **Personalization:** Address the user, ${userName}, by their name from time to time to make the conversation more personal and engaging.
2.  **Contextual Recall:** You MUST leverage the conversation history to maintain context. If the user says "this project" or "that task", you must look at the previous messages to understand what they are referring to.

**Critical Rules of Operation:**
1.  **CURRENT TIME AWARENESS:** The current date and time are provided in the context. Use this information whenever the user asks for the current time or makes a time-relative request (e.g., "what's the plan for today?"). Do not state that you cannot access real-time information.
2.  **ACTION-ORIENTED:** Your primary function is to identify and execute actions based on the user's request.
3.  **IMAGE ANALYSIS:** If the user provides an image, you can see it. Analyze it and respond to their query about it. For example, if they ask 'what is this?', describe the image. If they ask to 'summarize this screenshot', extract the key information.
4.  **DOCUMENT ANALYSIS:** If the user uploads a PDF or Word document, its text content will be provided to you. Use this content to answer questions, summarize, or perform actions like creating a project based on a brief.
5.  **PROJECT CREATION FROM BRIEFS:** If a user pastes a block of text and asks to 'create a project from this', you must parse the text to extract the project name, a detailed description, potential start/due dates, budget, venue, and infer relevant services and team members to include in the \`CREATE_PROJECT\` action JSON.
6.  **CONFIRMATION WORKFLOW (FOR SENSITIVE ACTIONS):**
    a.  For sensitive actions like **creating tasks** or **deleting projects**, your FIRST response MUST be a natural language confirmation question.
        - Example for Task: "Sure, I can create the task 'Design new logo' in the 'Brand Refresh' project. Should I proceed?"
        - Example for Deletion: "Just to confirm, you want to permanently delete the project 'Old Website Backup'? This cannot be undone. Should I proceed?"
    b.  If the user's NEXT message is a confirmation (e.g., "yes", "ok, do it", "proceed"), your response MUST be ONLY the corresponding action JSON (\`CREATE_TASK\`, \`DELETE_PROJECT\`). Do not add any other text.
7.  **HANDLING FOLLOW-UP ANSWERS:**
    When you ask the user for clarification (e.g., "Which project do you mean?"), their next message is the answer to your question. You MUST use that answer to fulfill their *original* request. Do not treat their answer as a new, standalone command.
    - Example:
      - User: "Add a task to the marketing project."
      - You: "What should the task be called?"
      - User: "Draft Q3 blog post."
      - You: (You must now create the task 'Draft Q3 blog post' in the 'marketing project', not do something else with "Draft Q3 blog post".)
8.  **DIRECT ACTION FOR OTHER COMMANDS:** For all other non-sensitive actions (CREATE_PROJECT, UPDATE_PROJECT, etc.), you should act directly by responding with ONLY the action JSON.
9.  **QUESTION ANSWERING:** If the user's request is clearly a question seeking information (and not an action), then and only then should you answer in natural language.
10. **WEB & MAPS SEARCH:** You can search for information about real-world places or websites.
    - Example: "Find details for 'Starbucks Central Park Jakarta'"
    - Example: "Get the social media links for dyad.sh"
11. **DIRECT SCRAPE COMMAND:** If the user's message starts with "scrape:", treat it as a direct command to use the SEARCH_MAPS_AND_WEBSITE action. The text following "scrape:" is the query. Do not ask for confirmation; execute the action immediately.

**Your entire process is:**
1. Analyze the user's latest message and any attached image or document.
2. Is it a request to create a task or delete a project?
   - YES: Respond with a natural language recommendation and wait for confirmation. If they have already confirmed, respond with the appropriate action JSON.
   - NO: Is it another action?
     - YES: Respond with the appropriate action JSON.
     - NO: It's a question (or an image/document to analyze). Answer it naturally.

AVAILABLE ACTIONS:
You can perform several types of actions. When you decide to perform an action, you MUST respond ONLY with a JSON object in the specified format.

1. CREATE_PROJECT:
{"action": "CREATE_PROJECT", "project_details": {"name": "<project name>", "description": "<desc>", "start_date": "YYYY-MM-DD", "due_date": "YYYY-MM-DD", "venue": "<venue>", "budget": 12345, "services": ["Service 1"], "members": ["User Name"]}}
- The current user will be the project owner. 'members' are additional people to add to the project.
- If the user does not explicitly list services, you MUST analyze the project name and description to infer a list of relevant services from the 'Available Services' context and include them in the 'services' array. For example, a 'gala dinner' project might need 'Venue', 'Food & Beverage', and 'Entertainment'.

2. UPDATE_PROJECT:
{"action": "UPDATE_PROJECT", "project_name": "<project name>", "updates": {"field": "value", "another_field": "value"}}
- Valid fields for 'updates' are: name, description, status, payment_status, budget, start_date, due_date, venue, add_members, remove_members, add_services, remove_services, add_tags, remove_tags.
- For 'add_tags' and 'remove_tags', the value should be an array of tag names. If a tag doesn't exist, it will be created with a default color.

3. DELETE_PROJECT:
{"action": "DELETE_PROJECT", "project_name": "<name of project to delete>"}

4. CREATE_TASK:
{"action": "CREATE_TASK", "project_name": "<project name>", "task_title": "<title of the new task>", "assignees": ["<optional user name>"]}

5. ASSIGN_TASK:
{"action": "ASSIGN_TASK", "project_name": "<project name>", "task_title": "<title of the task>", "assignees": ["<user name 1>", "<user name 2>"]}

6. UNASSIGN_TASK:
{"action": "UNASSIGN_TASK", "project_name": "<project name>", "task_title": "<title of the task>", "assignees": ["<user name 1>"]}

7. CREATE_GOAL:
{"action": "CREATE_GOAL", "goal_details": {"title": "<goal title>", "description": "<desc>", "type": "<type>", "frequency": "<freq>", "specific_days": ["Mo", "We"], "target_quantity": 123, "target_period": "Weekly", "target_value": 123, "unit": "USD", "icon": "IconName", "color": "#RRGGBB", "tags": [{"name": "Tag1", "color": "#RRGGBB"}]}}
- If a user provides only a title for a new goal, you MUST infer the other details.
- Infer a suitable 'description'.
- Choose an appropriate 'type' ('frequency', 'quantity', or 'value').
- Suggest a relevant 'icon' from the 'Available Icons' list and a suitable 'color'.
- Create 2-3 relevant 'tags' as an array of objects like '[{"name": "Health", "color": "#FF6B6B"}, {"name": "Hobby", "color": "#F7B801"}]'. These will be new tags.
- Example: User says "create a goal to learn guitar". You might respond with: {"action": "CREATE_GOAL", "goal_details": {"title": "Learn Guitar", "description": "Practice guitar regularly to improve skills.", "type": "frequency", "frequency": "Weekly", "specific_days": ["Mo", "We", "Fr"], "icon": "Music", "color": "#4ECDC4", "tags": [{"name": "Music", "color": "#4ECDC4"}, {"name": "Hobby", "color": "#F7B801"}]}}

8. UPDATE_GOAL:
{"action": "UPDATE_GOAL", "goal_title": "<title of the goal to update>", "updates": {"field": "value", "another_field": "value"}}
- Valid fields for 'updates' are: title, description, type, frequency, specific_days, target_quantity, target_period, target_value, unit, icon, color, add_tags, remove_tags.
- For 'add_tags' and 'remove_tags', the value should be an array of tag names.

9. CREATE_ARTICLE:
{"action": "CREATE_ARTICLE", "article_details": {"title": "<article title>", "content": "<h2>Sub-judul Contoh</h2><p>Ini adalah pendahuluan.</p>", "folder_name": "<optional folder name>", "header_image_search_query": "<optional image search query>"}}
- When creating an article, the 'content' MUST be well-structured HTML. It should include an engaging introduction, key insights, actionable steps in a list format (<ul> or <ol>), and a concluding summary. The content should be comprehensive and valuable.
- If folder_name is not provided or does not exist, it will be placed in a default "Uncategorized" folder for the user.
- If 'header_image_search_query' is provided, I will find an image on Unsplash and set it as the article's header image.

10. UPDATE_ARTICLE:
{"action": "UPDATE_ARTICLE", "article_title": "<title of article to update>", "updates": {"title": "<new title>", "content": "<new HTML content>", "folder_name": "<new folder name>", "header_image_search_query": "<optional image search query>"}}
- 'content' will replace the existing content. To append, first get the existing content and then provide the full new content.
- Use 'header_image_search_query' to find and set a new header image for the article.

11. DELETE_ARTICLE:
{"action": "DELETE_ARTICLE", "article_title": "<title of article to delete>"}

12. CREATE_FOLDER:
{"action": "CREATE_FOLDER", "folder_details": {"name": "<folder name>", "description": "<desc>", "icon": "IconName", "color": "#RRGGBB", "category": "<category>"}}
- If the user only provides a name, you MUST infer the other details.
- Suggest a relevant 'icon' from the 'Available Icons' list and a suitable 'color'.

13. SEARCH_MAPS_AND_WEBSITE:
{"action": "SEARCH_MAPS_AND_WEBSITE", "query": "<search query for a place or a website URL>"}

CONTEXT:
- Current Date & Time: ${new Date().toISOString()}
- Available Projects (with their tasks and tags): ${JSON.stringify(context.summarizedProjects, null, 2)}
- Available Goals: ${JSON.stringify(context.summarizedGoals, null, 2)}
- Available Users: ${JSON.stringify(context.userList, null, 2)}
- Available Services: ${JSON.stringify(context.serviceList, null, 2)}
- Available Icons: ${JSON.stringify(context.iconList, null, 2)}
- Available Articles: ${JSON.stringify(context.summarizedArticles, null, 2)}
- Available Folders: ${JSON.stringify(context.summarizedFolders, null, 2)}
`;

const articleWriterFeaturePrompts = {
  'generate-article-from-title': {
    system: `You are an expert writer. Write a comprehensive article in HTML format based on the following title. The article should be well-structured with an engaging introduction, headings (h2, h3), paragraphs (p), and lists (ul, li) where appropriate. **Important: Do NOT include the main title (as an h1 tag or otherwise) in your HTML response, as it will be displayed separately.** Respond ONLY with the HTML content.`,
    user: (payload) => `Title: "${payload.title}"`,
    max_tokens: 2048,
  },
  'expand-article-text': {
    system: `You are an expert writer. Your task is to expand upon a selected piece of text within a larger article. Develop the idea further, add more detail, and ensure it flows naturally with the rest of the content. Respond ONLY with the new, expanded HTML content that should replace the original selected text. Do not repeat the original text unless it's naturally part of the expansion.`,
    user: (payload) => `Article Title: "${payload.title}"\n\nFull Article Content (for context):\n${payload.fullContent}\n\nExpand this selected text:\n"${payload.selectedText}"`,
    max_tokens: 1024,
  },
  'improve-article-content': {
    system: `You are an expert editor. Improve the following article content for clarity, grammar, and engagement. Maintain the original meaning and tone. Respond ONLY with the improved HTML content, preserving the original HTML structure as much as possible. Do not add any explanatory text before or after the HTML.`,
    user: (payload) => `Improve this content:\n\n${payload.content}`,
    max_tokens: 2048,
  },
  'summarize-article-content': {
    system: `You are an expert editor. Your task is to summarize the provided text.
- If you are given only 'content', summarize that content.
- If you are given 'content' (a selection), 'fullArticleContent', and 'articleTitle', summarize the 'content' selection *within the context* of the full article. The summary should fit seamlessly back into the article.
- The summary should be concise, capture the main points, and be presented in well-structured HTML format (paragraphs, lists).
- Respond ONLY with the summarized HTML content.`,
    user: (payload) => {
      if (payload.fullArticleContent && payload.articleTitle) {
        return `Article Title: "${payload.articleTitle}"\n\nFull Article Content (for context):\n${payload.fullContent}\n\nSummarize this selected text:\n"${payload.content}"`;
      }
      return `Summarize this content:\n\n${payload.content}`;
    },
    max_tokens: 1024,
  }
};

async function analyzeProjects(payload, context) {
  const { openai, user, userSupabase, supabaseAdmin } = context;
  let { prompt, attachmentUrl, attachmentType, replyToMessageId } = payload;
  
  if (!prompt && !attachmentUrl) {
    throw new Error("An analysis prompt is required.");
  }

  let documentContext = '';
  if (attachmentUrl && (attachmentType === 'application/pdf' || attachmentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    try {
      const response = await fetch(attachmentUrl);
      if (!response.ok) throw new Error(`Failed to fetch attachment from storage: ${response.statusText}`);
      const fileBuffer = await response.arrayBuffer();

      if (attachmentType === 'application/pdf') {
        const pdf = await pdfjs.getDocument(fileBuffer).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(item => item.str).join(' ') + '\n';
        }
        documentContext = textContent;
      } else if (attachmentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value } = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
        documentContext = value;
      }
    } catch (e) {
      return { result: `I'm sorry, I had trouble reading the attached document. Error: ${e.message}` };
    }
  }

  if (attachmentUrl && attachmentType?.startsWith('audio/')) {
    try {
      const audioResponse = await fetch(attachmentUrl);
      if (!audioResponse.ok) throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
      
      const transcription = await openai.audio.transcriptions.create({
        file: audioResponse,
        model: "whisper-1",
      });
      
      prompt = transcription.text;
      
      const { error: updateError } = await userSupabase
        .from('ai_chat_history')
        .update({ content: `(Voice Message): ${prompt}` })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (updateError) console.error("Failed to update history with transcription:", updateError);

    } catch (transcriptionError) {
      throw new Error(`Failed to transcribe audio: ${transcriptionError.message}`);
    }
  }

  const { data: history, error: historyError } = await userSupabase
    .from('ai_chat_history')
    .select('sender, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(20);
  if (historyError) throw historyError;

  const actionContext = await buildContext(userSupabase, user);
  const currentUserProfile = actionContext.userList.find(u => u.id === user.id);
  const currentUserName = currentUserProfile ? currentUserProfile.name : 'there';
  const systemPrompt = getAnalyzeProjectsSystemPrompt(actionContext, currentUserName);

  const userContent = [];
  let combinedRequest = prompt || '';
  if (documentContext) {
    combinedRequest += `\n\n--- Attached Document Content ---\n${documentContext}`;
  }

  if (combinedRequest) {
    userContent.push({ type: "text", text: combinedRequest });
  }
  
  if (attachmentUrl && (attachmentType?.startsWith('image/'))) {
    userContent.push({ type: "image_url", image_url: { url: attachmentUrl } });
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []).map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.content })),
    { role: "user", content: userContent }
  ];

  const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.1,
      max_tokens: 1000,
  });

  const responseText = response.choices[0].message.content;
  
  if (responseText) {
    await userSupabase.from('ai_chat_history').insert({ 
      user_id: user.id, 
      sender: 'ai', 
      content: responseText 
    });
  }

  if (history.length === 1 && history[0].sender === 'user') {
    const userQuestion = history[0].content;
    const aiAnswer = responseText;
    const userEmail = user.email;
    const userName = currentUserName;

    const emailSubject = `AI Assistant Interaction: ${userName}`;
    const emailHtml = `
      <p>A user has interacted with the AI assistant.</p>
      <p><strong>User:</strong> ${userName} (${userEmail})</p>
      <hr>
      <p><strong>Question:</strong></p>
      <p>${userQuestion}</p>
      <br>
      <p><strong>AI Answer:</strong></p>
      <p>${aiAnswer.replace(/\n/g, '<br>')}</p>
    `;
    
    await sendEmail('adri@7inked.com', emailSubject, emailHtml);
  }

  try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
      if (!jsonMatch) {
          return { result: responseText };
      }
      const jsonString = jsonMatch[1] || jsonMatch[2];
      const actionData = JSON.parse(jsonString);

      const actionResult = await executeAction(actionData, { ...actionContext, userSupabase, user });
      
      await userSupabase.from('ai_chat_history').insert({ user_id: user.id, sender: 'ai', content: actionResult });

      return { result: actionResult };

  } catch (e) {
      return { result: `I'm sorry, I encountered an error while processing that action: ${e.message}` };
  }
}

async function analyzeDuplicates(payload, context) {
  const { openai } = context;
  const { duplicates } = payload;
  if (!duplicates) {
    throw new Error("Duplicates data is required for analysis.");
  }

  const systemPrompt = `You are a data quality assistant. Here is a list of potential duplicate contacts. Summarize the findings in a friendly, concise paragraph in markdown format. Mention the total number of pairs found and the common reasons (e.g., 'similar names or shared emails'). Then, recommend that the user review and merge them to keep their contact list clean.`;
  const userPrompt = `Analyze these potential duplicates:\n${JSON.stringify(duplicates, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 250,
  });

  return { result: response.choices[0].message.content };
}

async function aiMergeContacts(payload, context) {
  const { supabaseAdmin, openai } = context;
  const { primary_person_id, secondary_person_id } = payload;
  if (!primary_person_id || !secondary_person_id) {
    throw new Error("Primary and secondary person IDs are required.");
  }

  const { data: peopleData, error: peopleError } = await supabaseAdmin
    .rpc('get_people_with_details')
    .in('id', [primary_person_id, secondary_person_id]);

  if (peopleError) throw peopleError;
  if (!peopleData || peopleData.length < 2) throw new Error("Could not find both contacts to merge.");

  const primaryPerson = peopleData.find(p => p.id === primary_person_id);
  const secondaryPerson = peopleData.find(p => p.id === secondary_person_id);

  const systemPrompt = `You are an intelligent contact merging assistant. Your task is to merge two JSON objects representing two people into a single, consolidated JSON object. Follow these rules carefully:

1.  **Primary Record**: The user will designate one record as "primary". You should prioritize data from this record but intelligently incorporate data from the "secondary" record.
2.  **No Data Deletion**: Do not discard information from the secondary record. If a field from the secondary record conflicts with the primary (e.g., a different job title), and cannot be combined, add the secondary information to the 'notes' field in a structured way, like "Also worked as: [Job Title] at [Company]".
3.  **Field Merging Logic**:
    *   **user_id**: This is the most important field. If the primary record has a user_id, keep it. If the primary does not but the secondary does, the merged record MUST inherit the user_id from the secondary record. If both have different user_ids, this is a conflict; keep the primary's user_id and add a note like "This contact was merged with another registered user (ID: [secondary_user_id])".
    *   **full_name, email**: If the merged record has a user_id, these fields should be taken from the record that provided the user_id, as they are managed by the user's profile.
    *   **avatar_url, company, job_title, department, birthday**: If both records have a value, prefer the primary record's value. Add the secondary record's value to the 'notes' if it's different and seems important (e.g., a different company or job title).
    *   **contact (emails, phones)**: Combine the arrays, ensuring all unique values are kept. Do not duplicate entries.
    *   **social_media**: Merge the two JSON objects. If a key exists in both (e.g., 'linkedin'), the primary record's value takes precedence.
    *   **notes**: Intelligently combine the notes from both records. Do not simply concatenate them. Summarize if possible, remove redundancy, and add a separator like "--- Merged Notes ---" if you are combining distinct blocks of text. Also, add any conflicting information from other fields here.
4.  **Output Format**: Your response MUST be ONLY the final, merged JSON object representing the person. Do not include any explanations, markdown formatting, or other text. The JSON should be a valid object that can be parsed directly.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Merge these two contacts. \n\nPrimary Contact:\n${JSON.stringify(primaryPerson, null, 2)}\n\nSecondary Contact:\n${JSON.stringify(secondaryPerson, null, 2)}` }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const mergedPersonJSON = response.choices[0].message.content;
  if (!mergedPersonJSON) {
      throw new Error("AI failed to return a merged contact.");
  }
  const mergedPerson = JSON.parse(mergedPersonJSON);

  const allProjectIds = [...new Set([...(primaryPerson.projects || []).map(p => p.id), ...(secondaryPerson.projects || []).map(p => p.id)])];
  const allTagIds = [...new Set([...(primaryPerson.tags || []).map(t => t.id), ...(secondaryPerson.tags || []).map(t => t.id)])];

  const { error: upsertError } = await supabaseAdmin.rpc('upsert_person_with_details', {
      p_id: primary_person_id,
      p_full_name: mergedPerson.full_name,
      p_contact: mergedPerson.contact,
      p_company: mergedPerson.company,
      p_job_title: mergedPerson.job_title,
      p_department: mergedPerson.department,
      p_social_media: mergedPerson.social_media,
      p_birthday: mergedPerson.birthday,
      p_notes: mergedPerson.notes,
      p_avatar_url: mergedPerson.avatar_url,
      p_address: mergedPerson.address,
      p_project_ids: allProjectIds,
      p_existing_tag_ids: allTagIds,
      p_custom_tags: [],
  });

  if (upsertError) {
      throw new Error(`Failed to update primary contact: ${upsertError.message}`);
  }

  const { error: deleteError } = await supabaseAdmin.from('people').delete().eq('id', secondary_person_id);
  if (deleteError) {
      console.error(`Failed to delete secondary contact ${secondary_person_id}: ${deleteError.message}`);
  }

  return { message: "Contacts merged successfully by AI." };
}

async function articleWriter(payload, context) {
  const { openai, feature } = context;
  const promptConfig = articleWriterFeaturePrompts[feature];

  if (!promptConfig) {
    throw new Error(`Unknown article writer feature: ${feature}`);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: promptConfig.system },
      { role: "user", content: promptConfig.user(payload) }
    ],
    temperature: 0.7,
    max_tokens: promptConfig.max_tokens,
  });

  return { result: response.choices[0].message.content?.trim() };
}

async function generateCaption(payload, context) {
  const { openai } = context;
  const { altText } = payload;
  if (!altText) {
    throw new Error("altText is required for generating a caption.");
  }

  const systemPrompt = `You are an AI that generates a short, inspiring, one-line caption for an image. The caption should be suitable for a professional dashboard related to events, marketing, and project management. Respond with ONLY the caption, no extra text or quotes. Keep it under 12 words.`;
  const userPrompt = `Generate a caption for an image described as: "${altText}"`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 30,
  });

  const caption = response.choices[0].message.content?.trim().replace(/"/g, '');
  return { caption };
}

async function generateMoodInsight(payload, context) {
  const { openai } = context;
  const { prompt, userName, conversationHistory } = payload;
  if (!prompt) {
    throw new Error("Prompt is required for generating mood insights.");
  }

  const systemPrompt = `Anda adalah seorang teman AI yang suportif, empatik, dan berwawasan luas. Tujuan Anda adalah untuk terlibat dalam percakapan yang mendukung dengan pengguna tentang suasana hati dan perasaan mereka. Anda akan menerima riwayat percakapan. Tugas Anda adalah memberikan respons berikutnya dalam percakapan tersebut. Pertahankan nada yang positif dan memotivasi. Sapa pengguna dengan nama mereka jika ini adalah awal percakapan. Jaga agar respons tetap sangat ringkas, maksimal 2 kalimat, dan terasa seperti percakapan alami. Jangan mengulangi diri sendiri. Fokus percakapan ini adalah murni pada kesejahteraan emosional. Jangan membahas topik lain seperti proyek, tugas, atau tujuan kerja kecuali jika pengguna secara eksplisit mengungkitnya terlebih dahulu dalam konteks perasaan mereka. Selalu berikan respons dalam Bahasa Indonesia.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...(conversationHistory || []).map(msg => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.content
    })),
    { role: "user", content: prompt }
  ];
  
  if (messages.length > 2 && messages[messages.length-2].role === 'user' && messages[messages.length-2].content === prompt) {
    messages.splice(messages.length-2, 1);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: messages,
    temperature: 0.7,
    max_tokens: 200,
  });

  return { result: response.choices[0].message.content };
}

async function suggestIcon(payload, context) {
  const { openai } = context;
  const { title, icons } = payload;
  if (!title || !icons || !Array.isArray(icons)) {
    throw new Error("Title and a list of icons are required.");
  }

  const systemPrompt = `You are an AI assistant that suggests the best icon for a given title from a list. Your response must be ONLY the name of the icon from the list provided, with no extra text, explanation, or punctuation.`;
  const userPrompt = `Title: "${title}"\n\nIcons: [${icons.join(', ')}]`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0,
    max_tokens: 20,
  });

  return { result: response.choices[0].message.content?.trim() };
}

async function generateInsight(payload, context) {
  const { openai } = context;
  const { goal, context: progressContext } = payload;
  if (!goal || !progressContext) {
    throw new Error("Goal and context are required for generating insights.");
  }

  const owner = goal.collaborators.find(c => c.id === goal.user_id);
  const otherCollaborators = goal.collaborators.filter(c => c.id !== goal.user_id);

  const modifiedGoal = {
    ...goal,
    owner: owner,
    collaborators: otherCollaborators,
  };
  delete modifiedGoal.user_id;

  const systemPrompt = `Anda adalah seorang pelatih AI yang suportif dan berwawasan luas. Tujuan Anda adalah memberikan saran yang memotivasi dan dapat ditindaklanjuti kepada pengguna berdasarkan kemajuan mereka. Analisis detail tujuan berikut: judul, deskripsi, tipe, tag, pemilik (owner), kolaborator lain (collaborators), dan kemajuan terbaru. Berdasarkan analisis holistik ini, berikan wawasan singkat yang bermanfaat dalam format markdown.

- Pertahankan nada yang positif dan memotivasi.
- Sapa pengguna secara langsung. Jika ada pemilik (owner), sapa mereka sebagai pemilik tujuan.
- Jika ada kolaborator lain, Anda bisa menyebutkan mereka dalam konteks kolaborasi.
- Jika kemajuan baik, berikan pujian dan sarankan cara untuk mempertahankan momentum.
- Jika kemajuan tertinggal, berikan semangat, bukan kritik. Sarankan langkah-langkah kecil yang dapat dikelola untuk kembali ke jalur yang benar.
- Jaga agar respons tetap ringkas (2-4 kalimat).
- Jangan mengulangi data kembali kepada pengguna; interpretasikan data tersebut.
- PENTING: Selalu berikan respons dalam Bahasa Indonesia.`;

  const userPrompt = `Berikut adalah tujuan saya dan kemajuan terbaru saya. Tolong berikan saya beberapa saran pembinaan.
Tujuan: ${JSON.stringify(modifiedGoal, null, 2)}
Konteks Kemajuan: ${JSON.stringify(progressContext, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  return { result: response.choices[0].message.content };
}

async function aiSelectCalendarEvents(payload, context) {
  const { openai } = context;
  const { events, existingProjects } = payload;
  if (!events || !Array.isArray(events)) {
    throw new Error("A list of calendar events is required.");
  }

  const systemPrompt = `You are an AI assistant that helps users manage their projects. Your task is to analyze a list of upcoming Google Calendar events and decide which ones should be imported as new projects. You will be given a list of events and a list of existing project names for context.

Your rules are:
1.  Identify events that look like actual projects or significant client meetings. Ignore personal or trivial events (e.g., "Lunch", "Doctor's Appointment").
2.  Compare the event summaries with the list of existing project names. Do NOT select events that seem to be duplicates of existing projects.
3.  Your response MUST be a JSON object containing a single key: "event_ids_to_import". The value of this key must be an array of strings, where each string is the ID of an event you have chosen to import.
4.  If you determine that no events should be imported, respond with an empty array: {"event_ids_to_import": []}.
5.  Do not include any other text, explanation, or markdown in your response. Only the JSON object.`;

  const userPrompt = `Existing Projects:\n${JSON.stringify(existingProjects, null, 2)}\n\nCalendar Events to Analyze:\n${JSON.stringify(events.map(e => ({id: e.id, summary: e.summary, description: e.description})), null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content);
  return { result };
}

export const featureHandlers = {
  'analyze-duplicates': analyzeDuplicates,
  'ai-merge-contacts': aiMergeContacts,
  'generate-article-from-title': articleWriter,
  'expand-article-text': articleWriter,
  'improve-article-content': articleWriter,
  'summarize-article-content': articleWriter,
  'generate-caption': generateCaption,
  'generate-mood-insight': generateMoodInsight,
  'suggest-icon': suggestIcon,
  'analyze-projects': analyzeProjects,
  'generate-insight': generateInsight,
  'ai-select-calendar-events': aiSelectCalendarEvents,
};