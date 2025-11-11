import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.22.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// This list should be kept in sync with the frontend `lucideIconNames`
const iconNames = [
  'Activity', 'Anchor', 'Aperture', 'Award', 'BarChart', 'Bike', 'BookOpen', 'Briefcase', 'Brush', 'Calendar', 'Camera', 'Car', 'CheckCircle', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'DollarSign', 'Dumbbell', 'Feather', 'FileText', 'Film', 'Flag', 'Flame', 'Flower', 'Gamepad2', 'Gift', 'Globe', 'GraduationCap', 'Guitar', 'HardDrive', 'Headphones', 'Heart', 'Home', 'ImageIcon', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Mic', 'Moon', 'MountainSnow', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Rocket', 'Save', 'Scale', 'Scissors', 'Settings', 'Shield', 'Ship', 'ShoppingBag', 'Smile', 'Speaker', 'Sprout', 'Star', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Target', 'Tent', 'TrainFront', 'TreePine', 'TrendingUp', 'Trophy', 'Truck', 'Umbrella', 'Users', 'Utensils', 'Video', 'Volleyball', 'Wallet', 'Watch', 'Waves', 'Wind', 'Wine', 'Wrench', 'Zap'
];

const colorThemes = [
    { name: 'Blue', classes: 'bg-blue-100 text-blue-600' },
    { name: 'Green', classes: 'bg-green-100 text-green-600' },
    { name: 'Purple', classes: 'bg-purple-100 text-purple-600' },
    { name: 'Orange', classes: 'bg-orange-100 text-orange-600' },
    { name: 'Red', classes: 'bg-red-100 text-red-600' },
    { name: 'Gray', classes: 'bg-gray-100 text-gray-600' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

  try {
    const { title } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const prompt = `
      Based on the service title "${title}", generate a JSON object with three properties:
      1. "description": A concise, one-sentence description for the service.
      2. "icon": The most suitable icon name from this list: [${iconNames.join(', ')}].
      
      Your response MUST be a valid JSON object and nothing else. For example:
      {
        "description": "A service for creating beautiful websites.",
        "icon": "Laptop"
      }
    `;

    const msg = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const aiResponseText = msg.content[0].text;
    const jsonMatch = aiResponseText.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("AI response was not valid JSON.");
    }
    
    const { description, icon } = JSON.parse(jsonMatch[0]);

    if (!description || !icon || !iconNames.includes(icon)) {
        throw new Error("AI did not return the expected description and a valid icon.");
    }

    // Select a random color theme
    const randomColor = colorThemes[Math.floor(Math.random() * colorThemes.length)].classes;

    return new Response(
      JSON.stringify({ description, icon, icon_color: randomColor }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});