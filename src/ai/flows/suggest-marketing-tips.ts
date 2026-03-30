'use server';

/**
 * @fileOverview Provides productivity tips and workflow optimization suggestions via an AI chatbot, 
 * with context from the user's current tasks.
 *
 * - suggestProductivityTips - A function that suggests productivity tips and workflow optimizations.
 * - SuggestProductivityTipsInput - The input type for the suggestProductivityTips function.
 * - SuggestProductivityTipsOutput - The return type for the suggestProductivityTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  priority: z.string(),
  dueDate: z.string().optional(),
});

const SuggestProductivityTipsInputSchema = z.object({
  query: z.string().describe('The user query for productivity tips and workflow optimizations.'),
  tasks: z.array(ChatTaskSchema).optional().describe('Contextual task data to help the AI provide specific advice.'),
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
  prompt: `You are an AI assistant specialized in providing productivity tips and workflow optimizations for a planner app called MiinPlanner.

  {{#if tasks}}
  You have access to the user's current task list for context:
  {{{json tasks}}}
  {{/if}}

  Based on the user's query {{#if tasks}}and their current tasks{{/if}}, provide relevant and actionable suggestions to improve their planning, task management, and efficiency. Be specific if the query relates to their tasks.

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
      const response = await prompt(input);
      modelOutput = response.output;
    } catch (e: any) {
      console.error('[MiinPlanner suggestProductivityTipsFlow] Error:', e.message);
      modelOutput = null;
    }

    if (!modelOutput || !modelOutput.tips) {
      return {
        tips: "I'm sorry, I encountered an issue while processing your request. Please try again later.",
      };
    }
    return modelOutput;
  }
);
