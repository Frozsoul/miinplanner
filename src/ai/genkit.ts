
// src/ai/genkit.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

console.log('[MiinPlanner LOG] src/ai/genkit.ts: Module loading...'); // Log 1: Module start

const apiKey = process.env.GOOGLE_API_KEY;

if (process.env.NODE_ENV === 'production') {
  if (!apiKey || apiKey.trim() === "") {
    console.error(
      '[MiinPlanner LOG CRITICAL] src/ai/genkit.ts: GOOGLE_API_KEY environment variable is NOT SET or EMPTY in the App Hosting production environment. AI features will fail. Please VERIFY your `apphosting.yaml` `secretEnv` configuration and ensure the secret in Google Secret Manager has the correct API key value and that the App Hosting service account has Secret Accessor IAM permissions.'
    ); // Log 2a: API Key NOT SET/EMPTY in Prod
  } else {
    console.log(
      '[MiinPlanner LOG] src/ai/genkit.ts: GOOGLE_API_KEY IS SET in production. Length:', apiKey.length
    ); // Log 2b: API Key IS SET in Prod
    // For deeper debugging, you could temporarily log the first few chars, but be mindful of security:
    // console.log('[MiinPlanner LOG] src/ai/genkit.ts: GOOGLE_API_KEY starts with:', apiKey.substring(0, 4));
  }
} else { // Development environment
  if (!apiKey || apiKey.trim() === "") {
    console.warn(
      '[MiinPlanner LOG] src/ai/genkit.ts: GOOGLE_API_KEY environment variable is not set or is empty for local dev (in .env file). Genkit might use other auth methods (e.g., genkit auth login or ADC), or AI features may fail if no key is found.'
    ); // Log 2c: API Key NOT SET/EMPTY in Dev
  } else {
    console.log('[MiinPlanner LOG] src/ai/genkit.ts: GOOGLE_API_KEY IS SET for local dev. Length:', apiKey.length); // Log 2d: API Key IS SET in Dev
  }
}

let initializedAI: any;

try {
  console.log('[MiinPlanner LOG] src/ai/genkit.ts: Attempting to call genkit() with googleAI plugin...'); // Log 3: Attempting genkit()
  // Explicitly pass the apiKey if it exists, otherwise pass undefined which might make the plugin look for default env vars or throw.
  initializedAI = genkit({
    plugins: [
      googleAI(apiKey ? {apiKey} : undefined),
    ],
    model: 'googleai/gemini-2.0-flash', // Default model for the ai object
  });
  console.log('[MiinPlanner LOG] src/ai/genkit.ts: genkit() call completed successfully and googleAI plugin initialized.'); // Log 4a: genkit() success
} catch (e: any) {
  console.error('[MiinPlanner LOG CRITICAL] src/ai/genkit.ts: Error during genkit() or googleAI plugin initialization:'); // Log 4b: genkit() error start
  console.error('Error Name:', e.name);
  console.error('Error Message:', e.message); // This is where "Please pass in the API key..." error gets logged
  console.error('Error Stack:', e.stack);
  // Log the full error object for more details if possible
  console.error('Full Error Object:', JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
  
  // Fallback: create a dummy ai object to prevent crashes on ai.defineFlow etc.,
  // though flows using this dummy object will not work and will log errors.
  console.error("[MiinPlanner LOG CRITICAL] src/ai/genkit.ts: AI features will be non-functional due to initialization error. Review API key setup.");
  initializedAI = {
    defineFlow: (config: any, fn: any) => { console.error("[MiinPlanner AI Fallback] defineFlow called - AI NOT INITIALIZED"); return () => Promise.reject(new Error("AI Service Not Initialized Due to Earlier Error")); },
    definePrompt: (config: any) => { console.error("[MiinPlanner AI Fallback] definePrompt called - AI NOT INITIALIZED"); return () => Promise.reject(new Error("AI Service Not Initialized Due to Earlier Error")); },
    generate: (options: any) => { console.error("[MiinPlanner AI Fallback] generate called - AI NOT INITIALIZED"); return Promise.reject(new Error("AI Service Not Initialized Due to Earlier Error")); },
    // Add other methods used by your flows if necessary
  };
}

export const ai = initializedAI;
console.log('[MiinPlanner LOG] src/ai/genkit.ts: Module finished loading. Exporting "ai" object.'); // Log 5: Module end

