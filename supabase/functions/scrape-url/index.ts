// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const isUrl = (str) => {
  if (!str) return false;
  const trimmedStr = str.trim();
  if (trimmedStr.includes(' ') && !trimmedStr.startsWith('http') && !trimmedStr.startsWith('www.')) {
      return false;
  }
  try {
    new URL(trimmedStr);
    return true;
  } catch (_) {
    try {
        new URL('https://' + trimmedStr);
        return true;
    } catch (e) {
        return false;
    }
  }
};

const getValidUrl = (url) => {
  if (!url) return null;
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith('http')) return trimmedUrl;
  return `https://${trimmedUrl}`;
};

const findSocialLinks = (html) => {
  const links = {
    email: null,
    instagram: null,
    facebook: null,
    youtube: null,
    twitter: null,
  };
  const emailRegex = /mailto:([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/gi;
  const socialRegex = /href=["'](https?:\/\/(?:www\.)?(instagram|facebook|youtube|twitter)\.com\/[^"']+)["']/gi;

  let match;
  while ((match = emailRegex.exec(html)) !== null) {
    if (match[1]) {
      links.email = match[1];
      break;
    }
  }
  while ((match = socialRegex.exec(html)) !== null) {
    const platform = match[2];
    if (match[1] && !links[platform]) {
      links[platform] = match[1];
    }
  }
  return links;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized: User not authenticated');
    }

    const { query } = await req.json();
    if (!query) {
      throw new Error('A search query or URL is required.');
    }

    let result = {};
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (isUrl(query)) {
      const validUrl = getValidUrl(query);
      const hostname = new URL(validUrl).hostname;
      result = {
        Name: hostname,
        Website: validUrl,
        Domain: hostname,
        Fulladdress: null, Street: null, Categories: [], Phone: null, Review_Count: null,
        Average_Rating: null, Google_Maps_URL: null, Latitude: null, Longitude: null,
        Opening_Hours: null, Price: null, Featured_Image: null, Place_Id: null,
        Email: null, instagram: null, facebook: null, youtube: null, twitter: null,
      };
    } else {
      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key is not configured.');
      }
      
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.status !== 'OK') {
        throw new Error(`Google Maps API Error: ${searchData.status}. ${searchData.error_message || 'Please check your API key and ensure the Places API is enabled.'}`);
      }
      if (!searchData.results || searchData.results.length === 0) {
        throw new Error(`Could not find any results for "${query}" on Google Maps.`);
      }
      const placeId = searchData.results[0].place_id;

      const fields = 'name,formatted_address,address_components,type,formatted_phone_number,rating,user_ratings_total,url,geometry,website,opening_hours,price_level,photo,place_id';
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.status !== 'OK') {
        throw new Error(`Google Maps Details API Error: ${detailsData.status}. ${detailsData.error_message || ''}`);
      }
      const place = detailsData.result;
      const street = place.address_components?.find(c => c.types.includes('route'))?.long_name || '';
      let featuredImage = null;
      if (place.photos && place.photos.length > 0) {
        const photoReference = place.photos[0].photo_reference;
        featuredImage = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
      }
      const validWebsiteUrl = getValidUrl(place.website);

      result = {
        Name: place.name,
        Fulladdress: place.formatted_address,
        Street: street,
        Categories: place.types,
        Phone: place.formatted_phone_number,
        Review_Count: place.user_ratings_total,
        Average_Rating: place.rating,
        Google_Maps_URL: place.url,
        Latitude: place.geometry?.location?.lat,
        Longitude: place.geometry?.location?.lng,
        Website: validWebsiteUrl,
        Domain: validWebsiteUrl ? new URL(validWebsiteUrl).hostname : null,
        Opening_Hours: place.opening_hours?.weekday_text,
        Price: place.price_level,
        Featured_Image: featuredImage,
        Place_Id: place.place_id,
      };
    }

    if (result.Website) {
      try {
        const webResponse = await fetch(result.Website);
        if (webResponse.ok) {
          const html = await webResponse.text();
          const socialLinks = findSocialLinks(html);
          result.Email = socialLinks.email;
          result.instagram = socialLinks.instagram;
          result.facebook = socialLinks.facebook;
          result.youtube = socialLinks.youtube;
          result.twitter = socialLinks.twitter;
        }
      } catch (e) {
        console.warn(`Could not scrape website ${result.Website}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const status = error.message.includes('Unauthorized') ? 401 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }
})