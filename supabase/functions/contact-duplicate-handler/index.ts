// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';
import OpenAI from 'npm:openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const getOpenAIClient = async (supabaseAdmin: any) => {
  // 1. Try to get the key from environment variables first.
  const apiKeyFromEnv = Deno.env.get('OPENAI_API_KEY');
  if (apiKeyFromEnv) {
    return new OpenAI({ apiKey: apiKeyFromEnv });
  }

  // 2. If not in env, fall back to the database.
  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .single();

  if (configError || !config?.value) {
    // 3. If not found in either place, throw an error.
    throw new Error("OpenAI API key is not configured. Please set it in your application settings or as a Supabase secret.");
  }
  
  return new OpenAI({ apiKey: config.value });
};

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


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { primary_person_id, secondary_person_id } = await req.json();
    if (!primary_person_id || !secondary_person_id) {
      throw new Error("Primary and secondary person IDs are required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openai = await getOpenAIClient(supabaseAdmin);

    // Fetch both person records directly, bypassing RLS
    const { data: peopleData, error: peopleError } = await supabaseAdmin
      .from('people')
      .select(`
        *,
        people_projects ( projects (id, name, slug) ),
        people_tags ( tags (id, name, color) )
      `)
      .in('id', [primary_person_id, secondary_person_id]);

    if (peopleError) throw peopleError;
    if (!peopleData || peopleData.length < 2) throw new Error("Could not find both contacts to merge.");

    // Re-shape the data to match the expected format (projects and tags as direct arrays)
    const formattedPeopleData = peopleData.map(p => ({
        ...p,
        projects: p.people_projects.map(pp => pp.projects),
        tags: p.people_tags.map(pt => pt.tags),
        people_projects: undefined, // remove join table data
        people_tags: undefined,
    }));

    const primaryPerson = formattedPeopleData.find(p => p.id === primary_person_id);
    const secondaryPerson = formattedPeopleData.find(p => p.id === secondary_person_id);

    // Ask AI to merge
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
    const allProjectIds = [...new Set([...(primaryPerson.projects || []).map(p => p.id), ...(secondaryPerson.projects || []).map(p => p.id)])];
    const allTagIds = [...new Set([...(primaryPerson.tags || []).map(t => t.id), ...(secondaryPerson.tags || []).map(t => t.id)])];

    // 1. Update the primary person's details
    const { error: updateError } = await supabaseAdmin
      .from('people')
      .update({
        full_name: mergedPerson.full_name,
        contact: mergedPerson.contact,
        company: mergedPerson.company,
        job_title: mergedPerson.job_title,
        department: mergedPerson.department,
        social_media: mergedPerson.social_media,
        birthday: mergedPerson.birthday,
        notes: mergedPerson.notes,
        avatar_url: mergedPerson.avatar_url,
        address: mergedPerson.address,
        user_id: mergedPerson.user_id || primaryPerson.user_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', primary_person_id);
    if (updateError) throw new Error(`Failed to update primary contact: ${updateError.message}`);

    // 2. Re-link all projects
    await supabaseAdmin.from('people_projects').delete().eq('person_id', primary_person_id);
    if (allProjectIds.length > 0) {
        const projectLinks = allProjectIds.map(pid => ({ person_id: primary_person_id, project_id: pid }));
        const { error: projectLinkError } = await supabaseAdmin.from('people_projects').insert(projectLinks);
        if (projectLinkError) throw new Error(`Failed to link projects: ${projectLinkError.message}`);
    }

    // 3. Re-link all tags
    await supabaseAdmin.from('people_tags').delete().eq('person_id', primary_person_id);
    if (allTagIds.length > 0) {
        const tagLinks = allTagIds.map(tid => ({ person_id: primary_person_id, tag_id: tid }));
        const { error: tagLinkError } = await supabaseAdmin.from('people_tags').insert(tagLinks);
        if (tagLinkError) throw new Error(`Failed to link tags: ${tagLinkError.message}`);
    }

    // 4. Delete the secondary person
    const { error: deleteError } = await supabaseAdmin.from('people').delete().eq('id', secondary_person_id);
    if (deleteError) {
        console.error(`Failed to delete secondary contact ${secondary_person_id}: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ message: "Contacts merged successfully by AI." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});