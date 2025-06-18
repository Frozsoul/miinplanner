// src/ai/flows/suggest-marketing-tips.ts
'use server';

/**
 * @fileOverview Provides marketing tips and workflow optimization suggestions via an AI chatbot.
 *
 * - suggestMarketingTips - A function that suggests marketing tips and workflow optimizations.
 * - SuggestMarketingTipsInput - The input type for the suggestMarketingTips function.
 * - SuggestMarketingTipsOutput - The return type for the suggestMarketingTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMarketingTipsInputSchema = z.object({
  query: z.string().describe('The user query for marketing tips and workflow optimizations.'),
});
export type SuggestMarketingTipsInput = z.infer<typeof SuggestMarketingTipsInputSchema>;

const SuggestMarketingTipsOutputSchema = z.object({
  tips: z.string().describe('Marketing tips and workflow optimization suggestions.'),
});
export type SuggestMarketingTipsOutput = z.infer<typeof SuggestMarketingTipsOutputSchema>;

export async function suggestMarketingTips(input: SuggestMarketingTipsInput): Promise<SuggestMarketingTipsOutput> {
  return suggestMarketingTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMarketingTipsPrompt',
  input: {schema: SuggestMarketingTipsInputSchema},
  output: {schema: SuggestMarketingTipsOutputSchema},
  prompt: `You are an AI assistant specialized in providing marketing tips and workflow optimizations.

  Based on the user's query, provide relevant and actionable suggestions to improve their marketing strategies and efficiency.

  Query: {{{query}}}
  `,
});

const suggestMarketingTipsFlow = ai.defineFlow(
  {
    name: 'suggestMarketingTipsFlow',
    inputSchema: SuggestMarketingTipsInputSchema,
    outputSchema: SuggestMarketingTipsOutputSchema,
  },
  async (input) : Promise<SuggestMarketingTipsOutput> => {
    let modelOutput: z.infer<typeof SuggestMarketingTipsOutputSchema> | undefined | null = undefined;
    try {
      console.log('[MiinPlanner suggestMarketingTipsFlow] Attempting to call prompt with input:', JSON.stringify(input));
      const response = await prompt(input);
      modelOutput = response.output;
      console.log('[MiinPlanner suggestMarketingTipsFlow] Prompt call successful, output:', JSON.stringify(modelOutput));
    } catch (e: any) {
      console.error('[MiinPlanner suggestMarketingTipsFlow] Critical error during prompt execution:', e.message, e.stack);
      // Ensure modelOutput remains null/undefined to trigger fallback
      modelOutput = null;
    }

    if (!modelOutput || !modelOutput.tips) {
      console.warn('[MiinPlanner suggestMarketingTipsFlow] AI did not return valid tips or an error occurred. Using fallback.');
      return {
        tips: "I'm sorry, I encountered an issue while processing your request for marketing tips. Please try rephrasing your query or try again later.",
      };
    }
    return modelOutput;
  }
);
