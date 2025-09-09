// @ts-nocheck
import { Prompts } from '../_prompts/index.ts';
import { ContextBuilder } from '../_context/builder.ts';
import { ActionHandlers } from '../_actions/handler.ts';
import * as pdfjs from 'https://esm.sh/pdfjs-dist@4.4.168';
import mammoth from 'https://esm.sh/mammoth@1.7.2';
import { createApi } from 'https://esm.sh/unsplash-js@7.0.19';

export const FeatureHandlers = {
  sendEmail: async (to, subject, html, text) => {
    const emailFrom = Deno.env.get('EMAIL_FROM') || "Betterworks <no-reply@mail.betterworks.id>";
    const emailitApiKey = Deno.env.get('EMAILIT_API_KEY');

    if (!emailitApiKey) {
      console.error("Emailit API key is not configured on the server.");
      return;
    }

    const payload = { from: emailFrom, to, subject, html, text };

    try {
      const response = await fetch("https://api.emailit.com/v1/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${emailitApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Failed to send email via Emailit: HTTP ${response.status}`, errorData);
      } else {
        console.log(`Email sent successfully to ${to}`);
      }
    } catch (e) {
      console.error(`Error sending email: ${e.message}`);
    }
  },

  analyzeProjects: async (payload, context) => {
    const { openai, user, userSupabase } = context;
    let { request, conversationHistory, attachmentUrl, attachmentType } = payload;
    
    if (!request && !attachmentUrl) throw new Error("An analysis request is required.");

    let documentContext = '';
    if (attachmentUrl && (attachmentType === 'application/pdf' || attachmentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      try {
        const response = await fetch(attachmentUrl);
        if (!response.ok) throw new Error(`Failed to fetch attachment: ${response.statusText}`);
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
        } else {
          const { value } = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
          documentContext = value;
        }
      } catch (e) {
        return { result: `I had trouble reading the document. Error: ${e.message}` };
      }
    }

    if (attachmentUrl && attachmentType?.startsWith('audio/')) {
      try {
        const audioResponse = await fetch(attachmentUrl);
        if (!audioResponse.ok) throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
        
        const transcription = await openai.audio.transcriptions.create({ file: audioResponse, model: "whisper-1" });
        request = transcription.text;
        
        await userSupabase.from('ai_chat_history').update({ content: `(Voice Message): ${request}` }).eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
      } catch (transcriptionError) {
        throw new Error(`Failed to transcribe audio: ${transcriptionError.message}`);
      }
    }

    const { data: dbHistory, error: historyError } = await userSupabase.from('ai_chat_history').select('sender, content').eq('user_id', user.id).order('created_at', { ascending: true }).limit(20);
    if (historyError) throw historyError;

    const actionContext = await ContextBuilder.buildContext(userSupabase, user);
    const currentUserName = actionContext.userList.find(u => u.id === user.id)?.name || 'there';
    const systemPrompt = Prompts.getAnalyzeProjectsSystemPrompt(actionContext, currentUserName);

    const userContent = [];
    let combinedRequest = request || '';
    if (documentContext) combinedRequest += `\n\n--- Attached Document Content ---\n${documentContext}`;
    if (combinedRequest) userContent.push({ type: "text", text: combinedRequest });
    if (attachmentUrl && attachmentType?.startsWith('image/')) userContent.push({ type: "image_url", image_url: { url: attachmentUrl } });

    const messages = [
      { role: "system", content: systemPrompt },
      ...(dbHistory || []).map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.content })),
      { role: "user", content: userContent }
    ];

    const response = await openai.chat.completions.create({ model: "gpt-4o", messages, temperature: 0.1, max_tokens: 1000 });
    const responseText = response.choices[0].message.content;
    
    if (responseText) await userSupabase.from('ai_chat_history').insert({ user_id: user.id, sender: 'ai', content: responseText });

    if (dbHistory.length === 0) {
      await FeatureHandlers.sendEmail('adri@7inked.com', `AI Assistant Interaction: ${currentUserName}`, `<p><strong>User:</strong> ${currentUserName} (${user.email})</p><hr><p><strong>Question:</strong></p><p>${request}</p><br><p><strong>AI Answer:</strong></p><p>${responseText.replace(/\n/g, '<br>')}</p>`, null);
    }

    try {
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
        if (!jsonMatch) return { result: responseText };
        const jsonString = jsonMatch[1] || jsonMatch[2];
        const actionData = JSON.parse(jsonString);
        const actionResult = await ActionHandlers.executeAction(actionData, { ...actionContext, userSupabase, user, originalRequest: request });
        await userSupabase.from('ai_chat_history').insert({ user_id: user.id, sender: 'ai', content: actionResult });
        return { result: actionResult };
    } catch (e) {
        return { result: `I encountered an error while processing that action: ${e.message}` };
    }
  },

  analyzeDuplicates: async (payload, context) => {
    const { openai } = context;
    const { duplicates } = payload;
    if (!duplicates) throw new Error("Duplicates data is required.");

    const systemPrompt = `You are a data quality assistant. Here is a list of potential duplicate contacts. Summarize the findings in a friendly, concise paragraph in markdown format. Mention the total number of pairs found and the common reasons (e.g., 'similar names or shared emails'). Then, recommend that the user review and merge them to keep their contact list clean.`;
    const userPrompt = `Analyze these potential duplicates:\n${JSON.stringify(duplicates, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      temperature: 0.3, max_tokens: 250,
    });
    return { result: response.choices[0].message.content };
  },

  articleWriter: async (payload, context) => {
    const { openai, feature } = context;
    const promptConfig = Prompts.articleWriterFeaturePrompts[feature];
    if (!promptConfig) throw new Error(`Unknown article writer feature: ${feature}`);

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "system", content: promptConfig.system }, { role: "user", content: promptConfig.user(payload) }],
      temperature: 0.7, max_tokens: promptConfig.max_tokens,
    });
    return { result: response.choices[0].message.content?.trim() };
  },

  generateCaption: async (payload, context) => {
    const { openai } = context;
    const { altText } = payload;
    if (!altText) throw new Error("altText is required.");

    const systemPrompt = `You are an AI that generates a short, inspiring, one-line caption for an image. The caption should be suitable for a professional dashboard related to events, marketing, and project management. Respond with ONLY the caption, no extra text or quotes. Keep it under 12 words.`;
    const userPrompt = `Generate a caption for an image described as: "${altText}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      temperature: 0.7, max_tokens: 30,
    });
    const caption = response.choices[0].message.content?.trim().replace(/"/g, '');
    return { caption };
  },

  generateMoodInsight: async (payload, context) => {
    const { openai } = context;
    const { prompt, conversationHistory } = payload;
    if (!prompt) throw new Error("Prompt is required.");

    const systemPrompt = `Anda adalah seorang teman AI yang suportif, empatik, dan berwawasan luas. Tujuan Anda adalah untuk terlibat dalam percakapan yang mendukung dengan pengguna tentang suasana hati dan perasaan mereka. Anda akan menerima riwayat percakapan. Tugas Anda adalah memberikan respons berikutnya dalam percakapan tersebut. Pertahankan nada yang positif dan memotivasi. Sapa pengguna dengan nama mereka jika ini adalah awal percakapan. Jaga agar respons tetap sangat ringkas, maksimal 2 kalimat, dan terasa seperti percakapan alami. Jangan mengulangi diri sendiri. Fokus percakapan ini adalah murni pada kesejahteraan emosional. Jangan membahas topik lain seperti proyek, tugas, atau tujuan kerja kecuali jika pengguna secara eksplisit mengungkitnya terlebih dahulu dalam konteks perasaan mereka. Selalu berikan respons dalam Bahasa Indonesia.`;
    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.content })),
      { role: "user", content: prompt }
    ];
    
    if (messages.length > 2 && messages[messages.length-2].role === 'user' && messages[messages.length-2].content === prompt) {
      messages.splice(messages.length-2, 1);
    }

    const response = await openai.chat.completions.create({ model: "gpt-4-turbo", messages, temperature: 0.7, max_tokens: 200 });
    return { result: response.choices[0].message.content };
  },

  suggestIcon: async (payload, context) => {
    const { openai } = context;
    const { title, icons } = payload;
    if (!title || !icons || !Array.isArray(icons)) throw new Error("Title and icons list are required.");

    const systemPrompt = `You are an AI assistant that suggests the best icon for a given title from a list. Your response must be ONLY the name of the icon from the list provided, with no extra text, explanation, or punctuation.`;
    const userPrompt = `Title: "${title}"\n\nIcons: [${icons.join(', ')}]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      temperature: 0, max_tokens: 20,
    });
    return { result: response.choices[0].message.content?.trim() };
  },

  generateInsight: async (payload, context) => {
    const { openai } = context;
    const { goal, context: progressContext } = payload;
    if (!goal || !progressContext) throw new Error("Goal and context are required.");

    const owner = goal.collaborators.find(c => c.id === goal.user_id);
    const otherCollaborators = goal.collaborators.filter(c => c.id !== goal.user_id);
    const modifiedGoal = { ...goal, owner, collaborators: otherCollaborators };
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
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      temperature: 0.7, max_tokens: 200,
    });
    return { result: response.choices[0].message.content };
  },

  aiSelectCalendarEvents: async (payload, context) => {
    const { openai } = context;
    const { events, existingProjects } = payload;
    if (!events || !Array.isArray(events)) throw new Error("A list of calendar events is required.");

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
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      temperature: 0.1, response_format: { type: "json_object" },
    });
    const result = JSON.parse(response.choices[0].message.content);
    return { result };
  },
};