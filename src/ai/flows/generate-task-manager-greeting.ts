
'use server';

/**
 * @fileOverview AI flow to generate a task-focused greeting for the Task Manager page.
 *
 * - generateTaskManagerGreeting - A function that generates the greeting.
 * - InsightGenerationInput - The input type (reused from insights flow).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { InsightGenerationInput } from './generate-insights-flow';

// Re-importing the input schema to keep this file self-contained in what it uses.
const InsightTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['To Do', 'In Progress', 'Done', 'Pending', 'Review', 'Blocked']),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  createdAt: z.string().describe("The task's creation date in ISO 8601 format."),
  updatedAt: z.string().describe("The task's last updated date in ISO 8601 format."),
  dueDate: z.string().optional().describe("The task's due date in ISO 8601 format, if available."),
});
const InsightGenerationInputSchema = z.object({
  tasks: z.array(InsightTaskSchema),
  currentDate: z.string().describe("The current date in ISO 8601 format, for context."),
});

// The output is just a single string.
const GreetingOutputSchema = z.string().describe("A direct, task-focused greeting of 15-20 words.");


export async function generateTaskManagerGreeting(
  input: InsightGenerationInput
): Promise<string> {
  return generateTaskManagerGreetingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaskManagerGreetingPrompt',
  input: {schema: InsightGenerationInputSchema},
  output: {schema: GreetingOutputSchema},
  prompt: `You are a direct and helpful AI assistant for a marketing planner app called MiinPlanner.
Your goal is to provide a brief (15-20 words), task-focused greeting for the user on the Task Manager page.
The current date is {{currentDate}}.

Your tone should be about getting organized and taking action. Be direct, but not negative. You can mention overdue tasks or waiting tasks to create a sense of priority. Use idioms related to work and organization.

Examples:
- "A few high-priority items are waiting. Let's strike while the iron is hot and get them done!"
- "Several tasks are overdue. It's time to roll up our sleeves, get organized, and clear your plate."
- "Here's your task list. Let's see how many we can move to 'Done' today and put a feather in our cap."
- "Some tasks are waiting for review. Clearing those can unblock your team and get the ball rolling again."

Analyze the following tasks and generate a relevant greeting:
{{{json tasks}}}
`,
});

const generateTaskManagerGreetingFlow = ai.defineFlow(
  {
    name: 'generateTaskManagerGreetingFlow',
    inputSchema: InsightGenerationInputSchema,
    outputSchema: GreetingOutputSchema,
  },
  async (input) => {
    if (!input.tasks || input.tasks.length === 0) {
      return "Your task list is empty. Time to add a task and get the show on the road!";
    }

    try {
        const {output} = await prompt(input);
        return output || "Here are your tasks. Time to get to work and make things happen!";
    } catch (error) {
        console.error("Error generating task manager greeting:", error);
        return "Here are your tasks. Time to get to work and make things happen!";
    }
  }
);
