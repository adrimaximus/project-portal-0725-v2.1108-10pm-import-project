// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const getOpenAIClient = async (supabaseAdmin) => {
  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .single();

  if (configError || !config?.value) {
    throw new Error("OpenAI API key is not configured by an administrator.");
  }
  return new OpenAI({ apiKey: config.value });
};

const systemPrompt = `You are an intelligent contact merging assistant. Your task is to merge two JSON objects representing two people into a single, consolidated JSON object. Follow these rules carefully:

1.  **Primary Record**: The user will designate one record as "primary". You should prioritize data from this record but intelligently incorporate data from the "secondary" record.
2.  **No Data Deletion**: Do not discard information from the secondary record. If a field from the secondary record conflicts with the primary (e.g., a different job title), and cannot be combined, add the secondary information to the 'notes' field in a structured way, like "Also worked as: [Job Title] at [Company]".
3.  **Field Merging Logic**:
    *   **full_name**: Choose the most complete or formal name. If "Jane D." and "Jane Doe" are provided, choose "Jane Doe".
    *   **avatar_url, company, job_title, department, birthday**: If both records have a value, prefer the primary record's value. Add the secondary record's value to the 'notes' if it's different and seems important (e.g., a different company or job title).
    *   **contact (emails, phones)**: Combine the arrays, ensuring all unique values are kept. Do not duplicate entries.
    *   **social_media**: Merge the two JSON objects. If a key exists in both (e.g., 'linkedin'), the primary record's value takes precedence.
    *   **notes**: Intelligently combine the notes from both records. Do not simply concatenate them. Summarize if possible, remove redundancy, and add a separator like "--- Merged Notes ---" if you are combining distinct blocks of text. Also, add any conflicting information from other fields here.
4.  **Output Format**: Your response MUST be ONLY the final, merged JSON object representing the person. Do not include any explanations, markdown formatting, or other text. The JSON should be a valid object that can be parsed directly.`;


serve(async (req) => {
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

    // Fetch both person records with their relations
    const { data: peopleData, error: peopleError } = await supabaseAdmin
      .rpc('get_people_with_details')
      .in('id', [primary_person_id, secondary_person_id]);

    if (peopleError) throw peopleError;
    if (!peopleData || peopleData.length < 2) throw new Error("Could not find both contacts to merge.");

    const primaryPerson = peopleData.find(p => p.id === primary_person_id);
    const secondaryPerson = peopleData.find(p => p.id === secondary_person_id);

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