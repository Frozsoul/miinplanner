// src/ai/flows/suggest-marketing-tips.ts
'use server';

/**
 * @fileOverview Provides productivity tips and workflow optimization suggestions via an AI chatbot.
 *
 * - suggestProductivityTips - A function that suggests productivity tips and workflow optimizations.
 * - SuggestProductivityTipsInput - The input type for the suggestProductivityTips function.
 * - SuggestProductivityTipsOutput - The return type for the suggestProductivityTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProductivityTipsInputSchema = z.object({
  query: z.string().describe('The user query for productivity tips and workflow optimizations.'),
});
export type SuggestProductivityTipsInput = z.infer<typeof SuggestProductivityTipsInputSchema>;

const SuggestProductivityTipsOutputSchema = z.object({
  tips: z.string().describe('Productivity tips and workflow optimization suggestions.'),
});
export type SuggestProductivityTipsOutput = z.infer<typeof SuggestProductivityTipsOutputSchema>;

export async function suggestProductivityTips(input: SuggestProductivityTipsInput): Promise<SuggestProductivityTipsOutput> {
  return suggestProductivityTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProductivityTipsPrompt',
  input: {schema: SuggestProductivityTipsInputSchema},
  output: {schema: SuggestProductivityTipsOutputSchema},
  prompt: `You are an AI assistant specialized in providing productivity tips and workflow optimizations for a planner app.

  Based on the user's query, provide relevant and actionable suggestions to improve their planning, task management, and efficiency.

  Query: {{{query}}}
  `,
});

const suggestProductivityTipsFlow = ai.defineFlow(
  {
    name: 'suggestProductivityTipsFlow',
    inputSchema: SuggestProductivityTipsInputSchema,
    outputSchema: SuggestProductivityTipsOutputSchema,
  },
  async (input) : Promise<SuggestProductivityTipsOutput> => {
    let modelOutput: z.infer<typeof SuggestProductivityTipsOutputSchema> | undefined | null = undefined;
    try {
      console.log('[MiinPlanner suggestProductivityTipsFlow] Attempting to call prompt with input:', JSON.stringify(input));
      const response = await prompt(input);
      modelOutput = response.output;
      console.log('[MiinPlanner suggestProductivityTipsFlow] Prompt call successful, output:', JSON.stringify(modelOutput));
    } catch (e: any) {
      console.error('[MiinPlanner suggestProductivityTipsFlow] Critical error during prompt execution:', e.message, e.stack);
      // Ensure modelOutput remains null/undefined to trigger fallback
      modelOutput = null;
    }

    if (!modelOutput || !modelOutput.tips) {
      console.warn('[MiinPlanner suggestProductivityTipsFlow] AI did not return valid tips or an error occurred. Using fallback.');
      return {
        tips: "I'm sorry, I encountered an issue while processing your request for productivity tips. Please try rephrasing your query or try again later.",
      };
    }
    return modelOutput;
  }
);
