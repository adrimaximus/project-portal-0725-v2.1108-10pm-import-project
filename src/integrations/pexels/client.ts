import { createClient } from 'pexels';

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

let pexelsClient: ReturnType<typeof createClient> | null = null;

if (!PEXELS_API_KEY) {
  console.warn("Pexels API Key is not defined. The Pexels image feature will be disabled. Please add VITE_PEXELS_API_KEY to your .env file.");
} else {
  try {
    pexelsClient = createClient(PEXELS_API_KEY);
  } catch (e) {
    console.error("Failed to create Pexels client, likely due to an invalid API key format.", e);
    pexelsClient = null;
  }
}

export { pexelsClient };