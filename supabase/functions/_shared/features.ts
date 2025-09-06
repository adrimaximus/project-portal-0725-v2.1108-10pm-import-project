// @ts-nocheck
import { buildContext } from './context.ts';
import { executeAction } from './actions.ts';
import { getAnalyzeProjectsSystemPrompt, articleWriterFeaturePrompts } from './prompts.ts';
import * as pdfjs from 'https://esm.sh/pdfjs-dist@4.4.168';
import mammoth from 'https://esm.sh/mammoth@1.7.2';
import { createApi } from 'https://esm.sh/unsplash-js@7.0.19';

export async function analyzeProjects(payload, context) {
  console.log("[DIAGNOSTIC] analyzeProjects: Starting analysis.");
  const { openai, user, userSupabase, supabaseAdmin } = context;
  let { request, attachmentUrl, attachmentType, replyToMessageId } = payload;
  
  if (!request && !attachmentUrl) {
    throw new Error("An analysis request is required.");
  }

  let documentContext = '';
  if (attachmentUrl && (attachmentType === 'application/pdf' || attachmentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    console.log(`[DIAGNOSTIC] analyzeProjects: Detected document attachment for parsing: ${attachmentType}`);
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
      console.log("[DIAGNOSTIC] analyzeProjects: Document parsing successful.");
    } catch (e) {
      console.error("[DIAGNOSTIC] analyzeProjects: CRITICAL ERROR during document parsing:", e);
      return { result: `I'm sorry, I had trouble reading the attached document. Error: ${e.message}` };
    }
  }

  if (attachmentUrl && attachmentType?.startsWith('audio/')) {
    console.log("[DIAGNOSTIC] analyzeProjects: Detected audio attachment for transcription.");
    try {
      const audioResponse = await fetch(attachmentUrl);
      if (!audioResponse.ok) throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
      
      const transcription = await openai.audio.transcriptions.create({
        file: audioResponse,
        model: "whisper-1",
      });
      
      request = transcription.text;
      console.log("[DIAGNOSTIC] analyzeProjects: Transcription successful. Text:", request);
      
      const { error: updateError } = await userSupabase
        .from('ai_chat_history')
        .update({ content: `(Voice Message): ${request}` })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (updateError) console.error("Failed to update history with transcription:", updateError);

    } catch (transcriptionError) {
      console.error("[DIAGNOSTIC] analyzeProjects: CRITICAL ERROR during transcription:", transcriptionError);
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
  console.log("[DIAGNOSTIC] analyzeProjects: Fetched chat history.");

  const actionContext = await buildContext(supabaseAdmin, user);
  const currentUserProfile = actionContext.userList.find(u => u.id === user.id);
  const currentUserName = currentUserProfile ? currentUserProfile.name : 'there';
  const systemPrompt = getAnalyzeProjectsSystemPrompt(actionContext, currentUserName);
  console.log("[DIAGNOSTIC] analyzeProjects: System prompt generated.");

  const userContent = [];
  let combinedRequest = request || '';
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

  console.log("[DIAGNOSTIC] analyzeProjects: Sending request to OpenAI.");
  const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.1,
      max_tokens: 1000,
  });
  console.log("[DIAGNOSTIC] analyzeProjects: Received response from OpenAI.");

  const responseText = response.choices[0].message.content;
  
  if (responseText) {
    await userSupabase.from('ai_chat_history').insert({ 
      user_id: user.id, 
      sender: 'ai', 
      content: responseText 
    });
  }
  console.log("[DIAGNOSTIC] analyzeProjects: Saved AI response to history.");

  try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
      if (!jsonMatch) {
          console.log("[DIAGNOSTIC] analyzeProjects: No JSON action found in response. Returning natural language.");
          return { result: responseText };
      }
      const jsonString = jsonMatch[1] || jsonMatch[2];
      const actionData = JSON.parse(jsonString);
      console.log("[DIAGNOSTIC] analyzeProjects: Parsed JSON action:", actionData.action);

      const actionResult = await executeAction(actionData, { ...actionContext, userSupabase, user });
      console.log("[DIAGNOSTIC] analyzeProjects: Action executed. Result:", actionResult);
      
      await userSupabase.from('ai_chat_history').insert({ user_id: user.id, sender: 'ai', content: actionResult });

      return { result: actionResult };

  } catch (e) {
      console.error("[DIAGNOSTIC] analyzeProjects: Error parsing or executing action. Returning raw response.", e);
      return { result: `I'm sorry, I encountered an error while processing that action: ${e.message}` };
  }
}

export async function analyzeDuplicates(payload, context) {
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

export async function aiMergeContacts(payload, context) {
  const { supabaseAdmin, openai } = context;
  const { primary_person_id, secondary_person_id } = payload;
  if (!primary_person_id || !secondary_person_id) {
    throw new Error("Primary and secondary person IDs are required.");
  }

  // Fetch both person records with their relations
  const { data: peopleData, error: peopleError } = await supabaseAdmin
    .rpc('get_people_with_details')
    .in('id', [primary_person_id, secondary_person_id]);

  if (peopleError) throw peopleError;
  if (!peopleData || peopleData.length < 2) throw new Error("Could not find both contacts to merge.");

  const primaryPerson = peopleData.find(p => p.id === primary_person_id);
  const secondaryPerson = peopleData.find(p => p.id === secondary_person_id);

  // Ask AI to merge
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

  // --- Database Operations ---
  // Combine unique project and tag IDs from both original records
  const allProjectIds = [...new Set([...(primaryPerson.projects || []).map(p => p.id), ...(secondaryPerson.projects || []).map(p => p.id)])];
  const allTagIds = [...new Set([...(primaryPerson.tags || []).map(t => t.id), ...(secondaryPerson.tags || []).map(t => t.id)])];

  // Use the upsert RPC to update the primary person and their relations
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
      p_custom_tags: [], // We are not creating new tags here
  });

  if (upsertError) {
      throw new Error(`Failed to update primary contact: ${upsertError.message}`);
  }

  // Delete the secondary person
  const { error: deleteError } = await supabaseAdmin.from('people').delete().eq('id', secondary_person_id);
  if (deleteError) {
      // This is not ideal, but we should log it. The primary contact is updated.
      console.error(`Failed to delete secondary contact ${secondary_person_id}: ${deleteError.message}`);
  }

  return { message: "Contacts merged successfully by AI." };
}

export async function articleWriter(payload, context) {
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

export async function generateCaption(payload, context) {
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

export async function generateMoodInsight(payload, context) {
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

export async function suggestIcon(payload, context) {
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

export async function generateInsight(payload, context) {
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

export async function aiSelectCalendarEvents(payload, context) {
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