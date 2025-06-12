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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
