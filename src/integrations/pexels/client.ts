import { createClient } from 'pexels';

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

if (!PEXELS_API_KEY) {
  throw new Error("Pexels API Key must be defined in the environment variables. Please add VITE_PEXELS_API_KEY to your .env file.");
}

export const pexelsClient = createClient(PEXELS_API_KEY);