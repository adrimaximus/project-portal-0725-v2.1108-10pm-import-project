// @ts-nocheck
export const createSupabaseUserClient = async (req: Request) => { 
    const auth = req.headers.get("Authorization") || ""; 
    const { createClient } = await import("npm:@supabase/supabase-js@2.54.0"); 
    return createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: auth } } }); 
};

export const createSupabaseAdmin = async () => { 
    const { createClient } = await import("npm:@supabase/supabase-js@2.54.0"); 
    return createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""); 
};

export const getOpenAIClient = async (supabaseAdmin: any) => { 
    const OpenAI = (await import("npm:openai@4.29.2")).default; 
    const { data, error } = await supabaseAdmin.from("app_config").select("value").eq("key", "OPENAI_API_KEY").maybeSingle(); 
    if (error || !data?.value) throw new Error("OpenAI API key is not configured by an administrator."); 
    return new OpenAI({ apiKey: data.value }); 
};