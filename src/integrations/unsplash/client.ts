import { createApi } from 'unsplash-js';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  console.error("Unsplash Access Key is missing. Please add VITE_UNSPLASH_ACCESS_KEY to your .env file.");
}

export const unsplash = UNSPLASH_ACCESS_KEY ? createApi({
  accessKey: UNSPLASH_ACCESS_KEY,
}) : null;