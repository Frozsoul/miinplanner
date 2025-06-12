'use server';

/**
 * @fileOverview AI flow to generate content ideas for a content calendar based on trends and user preferences.
 *
 * - generateContentIdeas - A function that generates content ideas.
 * - GenerateContentIdeasInput - The input type for the generateContentIdeas function.
 * - GenerateContentIdeasOutput - The return type for the generateContentIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateContentIdeasInputSchema = z.object({
  keywords: z
    .string()
    .describe('Keywords related to the desired content, separated by commas.'),
  tone: z
    .string()
    .describe('The desired tone of the content, e.g., informative, humorous, professional.'),
  targetAudience: z
    .string()
    .describe('Description of the target audience for the content.'),
  numberOfIdeas: z
    .number()
    .default(3)
    .describe('The number of content ideas to generate.'),
});
export type GenerateContentIdeasInput = z.infer<
  typeof GenerateContentIdeasInputSchema
>;

const GenerateContentIdeasOutputSchema = z.object({
  ideas: z
    .array(z.string())
    .describe('An array of content ideas based on the provided inputs.'),
});
export type GenerateContentIdeasOutput = z.infer<
  typeof GenerateContentIdeasOutputSchema
>;

export async function generateContentIdeas(
  input: GenerateContentIdeasInput
): Promise<GenerateContentIdeasOutput> {
  return generateContentIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentIdeasPrompt',
  input: {schema: GenerateContentIdeasInputSchema},
  output: {schema: GenerateContentIdeasOutputSchema},
  prompt: `You are a content creation expert. Generate {{numberOfIdeas}} content ideas based on the following criteria:

Keywords: {{{keywords}}}
Tone: {{{tone}}}
Target Audience: {{{targetAudience}}}

Each idea should be a concise and engaging suggestion suitable for a content calendar. Return the ideas as a numbered list.`,
});

const generateContentIdeasFlow = ai.defineFlow(
  {
    name: 'generateContentIdeasFlow',
    inputSchema: GenerateContentIdeasInputSchema,
    outputSchema: GenerateContentIdeasOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
