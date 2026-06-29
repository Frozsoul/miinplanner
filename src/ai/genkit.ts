
// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * @fileOverview Initializes the Genkit AI instance with Google AI plugin.
 * Leverages the GOOGLE_API_KEY environment variable.
 */

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'production') {
  console.error('[MiinPlanner] Critical: GOOGLE_API_KEY is not set in production.');
}

export const ai = genkit({
  plugins: [
    googleAI(apiKey ? { apiKey } : undefined),
  ],
  model: 'googleai/gemini-2.0-flash', 
});
