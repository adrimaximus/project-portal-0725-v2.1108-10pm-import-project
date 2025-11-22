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

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const { title, body, target, targetValue, link } = await req.json()

    if (!title || !body) {
      throw new Error('Title and Body are required')
    }

    // 1. Determine Recipients
    let recipientIds: string[] = []

    if (target === 'all') {
      const { data: users, error } = await supabase.from('profiles').select('id').eq('status', 'active')
      if (error) throw error
      recipientIds = users.map(u => u.id)
    } else if (target === 'role') {
      const { data: users, error } = await supabase.from('profiles').select('id').eq('status', 'active').eq('role', targetValue)
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

    // 3. Process Messages (AI Personalization)
    const notificationInserts = []
    const recipientLinks = []
    const isPersonalized = (body.includes('{{name}}') || title.includes('{{name}}')) && !!anthropicKey

    // Function to call Anthropic for rewriting
    const rewriteWithAI = async (templateBody: string, name: string) => {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 300,
            messages: [{
              role: 'user',
              content: `Rewrite the following notification message for a user named "${name}". 
              The original message is: "${templateBody.replace('{{name}}', name)}".
              Instructions:
              1. Keep the core meaning exactly the same.
              2. Make the tone professional yet friendly.
              3. Add 1-2 relevant emojis to the text.
              4. Do NOT add any preamble or explanations, just return the rewritten message string.`
            }]
          })
        })
        const data = await response.json()
        return data.content?.[0]?.text || templateBody.replace('{{name}}', name)
      } catch (e) {
        console.error("AI rewrite failed:", e)
        return templateBody.replace('{{name}}', name)
      }
    }

    if (isPersonalized) {
      // Limit AI processing to prevent timeouts/rate limits if sending to ALL
      // If > 20 users, we fallback to simple replacement to be safe, unless specific target.
      // For 'specific' target, we always try AI.
      const useAI = target === 'specific' || recipientIds.length <= 20

      for (const userId of recipientIds) {
        const profile = profileMap.get(userId)
        const name = profile 
            ? (profile.first_name || profile.email?.split('@')[0] || 'User')
            : 'User'
        
        let personalBody = body.replace('{{name}}', name)
        const personalTitle = title.replace('{{name}}', name)

        if (useAI) {
           personalBody = await rewriteWithAI(body, name)
        }

        const { data: notif, error: notifError } = await supabase
            .from('notifications')
            .insert({
                type: 'broadcast',
                title: personalTitle,
                body: personalBody,
                resource_type: 'system',
                actor_id: null,
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
        // Shared notification for non-personalized bulk sends
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
        mode: isPersonalized ? 'ai-personalized' : 'standard'
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