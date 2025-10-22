import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { commentText } = await req.json();

    if (!commentText) {
      return new Response(JSON.stringify({ error: "Missing commentText" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: "Anthropic API key not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-03-01", // Use a stable version
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229", // Or another suitable model like claude-3-sonnet-20240229
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: `Generate a concise task title (max 10 words) from the following comment. The title should capture the main action or subject. Do not include any introductory phrases like "Task: " or "Title: ". Just the title itself.\n\nComment: "${commentText}"\n\nTask Title:`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Anthropic API error:", errorData);
      return new Response(JSON.stringify({ error: "Failed to generate title from AI", details: errorData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: response.status,
      });
    }

    const data = await response.json();
    const generatedTitle = data.content[0].text.trim();

    return new Response(JSON.stringify({ title: generatedTitle }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in generate-task-title function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});