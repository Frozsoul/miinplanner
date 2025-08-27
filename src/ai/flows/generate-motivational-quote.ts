
'use server';

/**
 * @fileOverview AI flow to generate a short, motivational quote based on a page context.
 *
 * - generateMotivationalQuote - A function that generates the quote.
 * - GenerateQuoteInput - The input type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuoteInputSchema = z.object({
  context: z.enum(['dashboard', 'tasks', 'calendar']).describe("The page context for the quote (e.g., 'dashboard', 'tasks').")
});

export type GenerateQuoteInput = z.infer<typeof GenerateQuoteInputSchema>;

const QuoteOutputSchema = z.string().describe("A short, motivational quote of 15-25 words, including the author if known.");

export async function generateMotivationalQuote(input: GenerateQuoteInput): Promise<string> {
  try {
    const result = await generateQuoteFlow(input);
    return result || getDefaultQuote(input.context);
  } catch (error) {
    console.error(`Error generating motivational quote for context '${input.context}':`, error);
    return getDefaultQuote(input.context);
  }
}

const prompt = ai.definePrompt({
  name: 'generateMotivationalQuotePrompt',
  input: {schema: GenerateQuoteInputSchema},
  output: {schema: QuoteOutputSchema},
  prompt: `You are a helpful AI assistant. Your goal is to provide a short, inspiring, and motivational quote for a user of a marketing planner app.
The quote should be relevant to the user's current context: '{{context}}'.

- If the context is 'dashboard', focus on general productivity, success, or starting the day.
- If the context is 'tasks', focus on focus, accomplishment, and overcoming challenges.
- If the context is 'calendar', focus on planning, time management, and future success.

The quote should be between 15 and 25 words. Include the author's name if it is well-known (e.g., "- Albert Einstein"). Do not add any other text or formatting.
`,
});

const generateQuoteFlow = ai.defineFlow(
  {
    name: 'generateQuoteFlow',
    inputSchema: GenerateQuoteInputSchema,
    outputSchema: QuoteOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output || getDefaultQuote(input.context);
  }
);

function getDefaultQuote(context: GenerateQuoteInput['context']): string {
    const quotes = {
        dashboard: "The secret of getting ahead is getting started. - Mark Twain",
        tasks: "The key is not to prioritize what's on your schedule, but to schedule your priorities. - Stephen Covey",
        calendar: "A goal without a plan is just a wish. - Antoine de Saint-Exupéry"
    };
    return quotes[context];
}
