
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Attempt to load the API key from the environment variable GOOGLE_API_KEY.
// This is crucial for Firebase App Hosting where secrets are typically injected as environment variables.
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'production') {
  // In a production environment (like App Hosting), an API key is essential.
  // This log will appear in Google Cloud Logging for your App Hosting service.
  console.error(
    'CRITICAL: GOOGLE_API_KEY environment variable is not set. AI features will likely fail. Ensure this variable is correctly configured in your App Hosting environment secrets.'
  );
} else if (!apiKey && process.env.NODE_ENV !== 'production') {
  // In development, the API key might be configured via `genkit auth login` or other means.
  // This is a warning if it's not found as an environment variable.
  console.warn(
    'Notice: GOOGLE_API_KEY environment variable is not set. In development, ensure Genkit is authenticated (e.g., via `genkit auth login`) or the key is provided through other means if direct environment variable use is intended.'
  );
} else if (apiKey && process.env.NODE_ENV === 'production') {
  console.log('GOOGLE_API_KEY found in production environment. Initializing Google AI plugin with it.');
}


export const ai = genkit({
  plugins: [
    // Explicitly pass the API key to the googleAI plugin if it's found.
    // If apiKey is undefined (e.g. in local dev using `genkit auth`),
    // the plugin will attempt its default authentication mechanisms.
    googleAI(apiKey ? { apiKey } : undefined),
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for the ai object
});
