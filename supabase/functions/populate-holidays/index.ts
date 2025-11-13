// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This function should be run by a cron job, so we use the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const currentYear = new Date().getFullYear();
    const targetYear = currentYear + 1; // Fetch for the upcoming year

    // Check if holidays for the target year already exist
    const { data: existingHolidays, error: checkError } = await supabaseAdmin
      .from('holidays')
      .select('holiday_date')
      .gte('holiday_date', `${targetYear}-01-01`)
      .lte('holiday_date', `${targetYear}-12-31`)
      .limit(1);

    if (checkError) {
      throw new Error(`Error checking for existing holidays: ${checkError.message}`);
    }

    if (existingHolidays.length > 0) {
      return new Response(JSON.stringify({ message: `Holidays for ${targetYear} already exist. No action taken.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fetch holidays from Nager.Date API
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${targetYear}/ID`);
    if (!response.ok) {
      throw new Error(`Failed to fetch holidays from Nager.Date API: ${response.statusText}`);
    }
    const holidays = await response.json();

    if (!Array.isArray(holidays)) {
      throw new Error("Invalid data format received from holiday API.");
    }

    const holidaysToInsert = holidays.map(holiday => ({
      holiday_date: holiday.date,
      holiday_name: holiday.name,
    }));

    if (holidaysToInsert.length === 0) {
      return new Response(JSON.stringify({ message: `No holidays found for ${targetYear}.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Insert into the database
    const { error: insertError } = await supabaseAdmin
      .from('holidays')
      .insert(holidaysToInsert);

    if (insertError) {
      throw new Error(`Error inserting holidays into database: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ message: `Successfully populated ${holidaysToInsert.length} holidays for ${targetYear}.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})