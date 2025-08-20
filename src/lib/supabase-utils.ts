import { supabase } from "@/integrations/supabase/client";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface InvokeOptions {
  method?: HttpMethod;
  body?: any;
}

export const invokeSupabaseFunction = async (functionName: string, options: InvokeOptions = {}) => {
  const { method = 'POST', body } = options;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("User not authenticated. Please sign in again.");
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || `Function call failed with status ${response.status}`);
    } catch (e) {
        throw new Error(`Function call failed with status ${response.status}: ${errorText}`);
    }
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  const data = await response.json();

  if (data && data.error) {
    throw new Error(data.error);
  }
  return data;
};