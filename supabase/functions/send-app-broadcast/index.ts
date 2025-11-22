import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { title, body, target, targetValue, link } = await req.json()

    if (!title || !body) {
      throw new Error('Title and Body are required')
    }

    // 1. Determine Recipients
    let recipientIds: string[] = []

    if (target === 'all') {
      // Fetch all active users
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'active')
      
      if (error) throw error
      recipientIds = users.map(u => u.id)
    } else if (target === 'role') {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'active')
        .eq('role', targetValue)
      
      if (error) throw error
      recipientIds = users.map(u => u.id)
    } else if (target === 'specific') {
      recipientIds = Array.isArray(targetValue) ? targetValue : [targetValue]
    }

    if (recipientIds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No recipients found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Fetch Profile Names for Personalization
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', recipientIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // 3. Process & Send (The AI Agent Logic - Simple Template Replacement)
    // In a more complex agent, this would use LLMs to generate variations.
    // Here we perform efficient batch processing.

    const notificationsToInsert = []
    const recipientLinks = []

    // Create a base notification record for each user (since body might be unique)
    // Note: If body is static (no {{name}}), we could optimize to 1 notification + many recipients.
    // But to support personalization, we create distinct notifications or use the recipient-specific context if the DB supports it.
    // The current schema supports a shared notification with many recipients.
    // To do personalization with the CURRENT schema (shared notification), we actually can't easily personalize the *body* stored in `notifications`.
    // However, for this feature request, the "Toast" is transient. 
    // BUT, the schema has `notifications` table which implies history.
    // WORKAROUND: If the body has {{name}}, we must create individual notifications per user.
    // If not, create one shared notification.

    const isPersonalized = body.includes('{{name}}') || title.includes('{{name}}')

    if (isPersonalized) {
        // Batch insert individual notifications
        for (const userId of recipientIds) {
            const profile = profileMap.get(userId)
            const name = profile 
                ? (profile.first_name || profile.email?.split('@')[0] || 'User')
                : 'User'
            
            const personalBody = body.replace(/{{name}}/g, name)
            const personalTitle = title.replace(/{{name}}/g, name)

            const { data: notif, error: notifError } = await supabase
                .from('notifications')
                .insert({
                    type: 'broadcast',
                    title: personalTitle,
                    body: personalBody,
                    resource_type: 'system',
                    actor_id: null, // System
                    data: link ? { link } : {}
                })
                .select()
                .single()
            
            if (!notifError && notif) {
                recipientLinks.push({
                    notification_id: notif.id,
                    user_id: userId
                })
            }
        }
    } else {
        // Create one shared notification
        const { data: notif, error: notifError } = await supabase
            .from('notifications')
            .insert({
                type: 'broadcast',
                title: title,
                body: body,
                resource_type: 'system',
                actor_id: null,
                data: link ? { link } : {}
            })
            .select()
            .single()

        if (notifError) throw notifError

        // Link all recipients
        recipientIds.forEach(userId => {
            recipientLinks.push({
                notification_id: notif.id,
                user_id: userId
            })
        })
    }

    // Bulk insert recipients
    if (recipientLinks.length > 0) {
        const { error: linkError } = await supabase
            .from('notification_recipients')
            .insert(recipientLinks)
        
        if (linkError) throw linkError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: recipientIds.length,
        mode: isPersonalized ? 'personalized' : 'shared'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})