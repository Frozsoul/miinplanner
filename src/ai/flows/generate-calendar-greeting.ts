
'use server';

/**
 * @fileOverview AI flow to generate a calendar-focused greeting for the Calendar page.
 *
 * - generateCalendarGreeting - A function that generates the greeting.
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
const GreetingOutputSchema = z.string().describe("A timeline-focused, one or two-sentence greeting.");


export async function generateCalendarGreeting(
  input: InsightGenerationInput
): Promise<string> {
  return generateCalendarGreetingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCalendarGreetingPrompt',
  input: {schema: InsightGenerationInputSchema},
  output: {schema: GreetingOutputSchema},
  prompt: `You are a schedule-focused AI assistant for a marketing planner app called MiinPlanner.
Your goal is to provide a brief, timeline-aware greeting for the user on the Calendar page.
The current date is {{currentDate}}.

Your tone should create a sense of urgency and awareness of time. Focus on upcoming deadlines and the weekly schedule.

Examples:
- "A few deadlines are approaching this week. Let's get them on the calendar and checked off."
- "Time is ticking! Let's look at the week ahead and plan for success."
- "Your calendar has some important dates coming up. Let's make sure nothing falls through the cracks."
- "The schedule is filling up. A well-planned week is a productive week."

Analyze the following tasks and generate a relevant, schedule-oriented greeting:
{{{json tasks}}}
`,
});

const generateCalendarGreetingFlow = ai.defineFlow(
  {
    name: 'generateCalendarGreetingFlow',
    inputSchema: InsightGenerationInputSchema,
    outputSchema: GreetingOutputSchema,
  },
  async (input) => {
    if (!input.tasks || input.tasks.length === 0) {
      return "Your calendar is looking clear. Schedule some tasks to map out your week!";
    }

    try {
        const {output} = await prompt(input);
        return output || "Here is your schedule. Let's plan your week.";
    } catch (error) {
        console.error("Error generating calendar greeting:", error);
        return "Here is your schedule. Let's plan your week.";
    }
  }
);
