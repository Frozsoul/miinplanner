
'use server';

/**
 * @fileOverview AI flow to generate a short, friendly dashboard greeting based on user's tasks.
 *
 * - generateDashboardGreeting - A function that generates the greeting.
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
const DashboardGreetingOutputSchema = z.string().describe("A friendly, one or two-sentence greeting.");


export async function generateDashboardGreeting(
  input: InsightGenerationInput
): Promise<string> {
  const result = await generateDashboardGreetingFlow(input);
  return result;
}

const prompt = ai.definePrompt({
  name: 'generateDashboardGreetingPrompt',
  input: {schema: InsightGenerationInputSchema},
  output: {schema: DashboardGreetingOutputSchema},
  prompt: `You are a friendly and encouraging AI assistant for a marketing planner app called MiinPlanner.
Your goal is to provide a brief, insightful, and motivating greeting for the user when they open their dashboard.
The current date is {{currentDate}}.

Look at the user's tasks and provide a 1-2 sentence summary. Be conversational and positive.

Examples:
- If there are many high-priority tasks: "You've got a busy day ahead with a few high-priority items. You can do it!"
- If many tasks are due soon: "Looks like a few deadlines are approaching this week. Let's get them checked off!"
- If progress was made recently: "You've been making great progress on your tasks. Let's keep the momentum going!"
- A general, positive greeting: "Here's what's on your plate for today. Let's make it a productive one!"

Do not list specific tasks. Keep it high-level and encouraging.

Analyze the following tasks:
{{{json tasks}}}
`,
});

const generateDashboardGreetingFlow = ai.defineFlow(
  {
    name: 'generateDashboardGreetingFlow',
    inputSchema: InsightGenerationInputSchema,
    outputSchema: DashboardGreetingOutputSchema,
  },
  async (input) => {
    // If there are no tasks, return a simple greeting without calling the AI.
    if (!input.tasks || input.tasks.length === 0) {
      return "Welcome! It looks like a clean slate. Add some tasks to get started.";
    }

    const {output} = await prompt(input);

    // If the model returns null or an empty string, provide a safe default.
    return output || "Welcome back! Let's have a productive day.";
  }
);

    