// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, updates, teamUpdates, serviceUpdates } = await req.json();
    if (!projectId) throw new Error("Project ID is required.");

    // 1. Buat klien Supabase dengan token otentikasi pengguna
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Verifikasi bahwa pengguna adalah anggota proyek (pemeriksaan keamanan)
    const { data: isMember, error: memberCheckError } = await userSupabase.rpc('is_project_member', { project_id_param: projectId });
    if (memberCheckError || !isMember) {
      throw new Error("Access Denied: You are not a member of this project.");
    }

    // 3. Buat klien admin untuk melakukan pembaruan (melewati RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Perbarui detail proyek utama
    if (updates && Object.keys(updates).length > 0) {
      const { error: projectUpdateError } = await supabaseAdmin
        .from('projects')
        .update(updates)
        .eq('id', projectId);
      if (projectUpdateError) throw projectUpdateError;
    }

    // 5. Perbarui anggota tim
    if (teamUpdates) {
      if (teamUpdates.toAdd.length > 0) {
        const membersToAdd = teamUpdates.toAdd.map(m => ({ project_id: projectId, user_id: m.id, role: m.role || 'member' }));
        const { error } = await supabaseAdmin.from('project_members').insert(membersToAdd);
        if (error) throw new Error(`Failed to add team members: ${error.message}`);
      }
      if (teamUpdates.toRemove.length > 0) {
        const membersToRemoveIds = teamUpdates.toRemove.map(m => m.id);
        const { error } = await supabaseAdmin.from('project_members').delete().eq('project_id', projectId).in('user_id', membersToRemoveIds);
        if (error) throw new Error(`Failed to remove team members: ${error.message}`);
      }
    }

    // 6. Perbarui layanan
    if (serviceUpdates) {
        if (serviceUpdates.toAdd.length > 0) {
            const servicesToAdd = serviceUpdates.toAdd.map(s => ({ project_id: projectId, service_title: s }));
            const { error } = await supabaseAdmin.from('project_services').insert(servicesToAdd);
            if (error) throw new Error(`Failed to add services: ${error.message}`);
        }
        if (serviceUpdates.toRemove.length > 0) {
            const { error } = await supabaseAdmin.from('project_services').delete().eq('project_id', projectId).in('service_title', serviceUpdates.toRemove);
            if (error) throw new Error(`Failed to remove services: ${error.message}`);
        }
    }

    return new Response(JSON.stringify({ message: "Project updated successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error updating project:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});