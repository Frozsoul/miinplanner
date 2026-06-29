import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai'; // correct for v1.8.0, already installed

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'production') {
  console.error('[MiinPlanner] Critical: GOOGLE_API_KEY is not set in production.');
}

export const ai = genkit({
  plugins: [
    googleAI(apiKey ? { apiKey } : undefined),
  ],
  model: 'googleai/gemini-2.5-flash', // only thing that changed from original
});