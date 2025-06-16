
'use server';
/**
 * @fileOverview AI flow to generate social media post content.
 *
 * - generateSocialMediaPost - A function that generates post content.
 * - GenerateSocialMediaPostInput - The input type for the function.
 * - GenerateSocialMediaPostOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Platform } from '@/types';

const GenerateSocialMediaPostInputSchema = z.object({
  platform: z.enum(['X', 'LinkedIn', 'Instagram']).describe("The social media platform for the post."),
  topic: z.string().min(5).describe('The main topic or idea for the post.'),
  tone: z.string().min(3).describe('The desired tone of the post (e.g., Professional, Casual, Witty).'),
  // Optional: Add more specific fields like keywords, target audience if needed
});
export type GenerateSocialMediaPostInput = z.infer<typeof GenerateSocialMediaPostInputSchema>;

const GenerateSocialMediaPostOutputSchema = z.object({
  postContent: z.string().describe('The generated social media post content.'),
});
export type GenerateSocialMediaPostOutput = z.infer<typeof GenerateSocialMediaPostOutputSchema>;

export async function generateSocialMediaPost(input: GenerateSocialMediaPostInput): Promise<GenerateSocialMediaPostOutput> {
  return generateSocialMediaPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialMediaPostPrompt',
  input: {schema: GenerateSocialMediaPostInputSchema},
  output: {schema: GenerateSocialMediaPostOutputSchema},
  prompt: `You are an expert social media content creator.
Generate a compelling post for the platform: {{platform}}.
The post should be about: {{{topic}}}.
The desired tone is: {{{tone}}}.

Keep the post concise and engaging, suitable for the {{platform}} platform.
Include relevant hashtags if appropriate for the platform.
Focus on providing only the post content in the output.
`,
});

const generateSocialMediaPostFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaPostFlow',
    inputSchema: GenerateSocialMediaPostInputSchema,
    outputSchema: GenerateSocialMediaPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.postContent) {
        // Fallback or error handling
        return { postContent: `Could not generate content for topic: ${input.topic}. Please try adjusting your prompt.` };
    }
    return output;
  }
);
