
'use server';

/**
 * @fileOverview AI flow to analyze user tasks and generate productivity insights.
 *
 * - generateInsights - A function that generates insights from tasks.
 * - InsightGenerationInput - The input type for the generateInsights function.
 * - AIInsights - The return type for the generateInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TaskStatus, TaskPriority } from '@/types';

// The input for the flow will be a simplified list of tasks
const InsightTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['To Do', 'In Progress', 'Done', 'Pending', 'Review', 'Blocked']),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  createdAt: z.string().describe("The task's creation date in ISO 8601 format."),
  updatedAt: z.string().describe("The task's last updated date in ISO 8601 format."),
  dueDate: z.string().optional().describe("The task's due date in ISO 8601 format, if available."),
});
export type InsightTask = z.infer<typeof InsightTaskSchema>;

const InsightGenerationInputSchema = z.object({
  tasks: z.array(InsightTaskSchema),
  currentDate: z.string().describe("The current date in ISO 8601 format, for context."),
});
export type InsightGenerationInput = z.infer<typeof InsightGenerationInputSchema>;


// The structured output we expect from the AI model
const AIInsightsSchema = z.object({
  summary: z.string().describe("A 2-3 sentence executive summary of the user's productivity and key areas for focus."),
  productivityScore: z.number().min(0).max(100).describe("A score from 0-100 representing overall productivity. Base it on completion rate, overdue tasks, and task load. 100 is perfect."),
  completionRate: z.object({
    daily: z.number().describe("Number of tasks completed in the last 24 hours."),
    weekly: z.number().describe("Number of tasks completed in the last 7 days."),
  }),
  averageCompletionTimeHours: z.number().describe("For completed tasks, the average time in hours from createdAt to the final updatedAt (when status became 'Done'). Return 0 if no tasks were completed."),
  atRiskTasks: z.array(z.object({
    taskId: z.string(),
    title: z.string(),
    dueDate: z.string(),
    reason: z.string().describe("A brief explanation of why the task is at risk."),
  })).describe("A list of tasks that are at risk of being delayed."),
  stalledTasks: z.array(z.object({
    taskId: z.string(),
    title: z.string(),
    lastUpdate: z.string(),
    reason: z.string().describe("A brief explanation of why the task is considered stalled."),
  })).describe("A list of tasks that seem to be stalled or forgotten."),
  proactiveSuggestions: z.array(z.string()).describe("An array of 3-5 actionable suggestions to improve productivity based on the data analysis."),
});
export type AIInsights = z.infer<typeof AIInsightsSchema>;


export async function generateInsights(input: InsightGenerationInput): Promise<AIInsights> {
  return generateInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInsightsPrompt',
  input: {schema: InsightGenerationInputSchema},
  output: {schema: AIInsightsSchema},
  prompt: `You are an expert productivity analyst and data scientist for a marketing planning app called MiinPlanner.
Your goal is to analyze the provided list of tasks and generate a comprehensive, data-driven insights report.
The current date is {{currentDate}}. Use this for all time-based calculations.

Your response MUST be a JSON object matching the provided schema.

Analysis Guidelines:
1.  **summary**: Write a 2-3 sentence executive summary of the user's current productivity state. Highlight one key strength and one major area for improvement.
2.  **productivityScore**: Calculate a score from 0-100. Consider factors like: the ratio of completed to total tasks, the number of overdue tasks, and how many tasks are high-priority. A high completion rate and few overdue tasks should result in a high score.
3.  **completionRate**: Count tasks moved to 'Done' status within the last 24 hours (daily) and last 7 days (weekly) from the current date.
4.  **averageCompletionTimeHours**: For tasks with status 'Done', calculate the average time difference in hours between 'createdAt' and their final 'updatedAt'. If no tasks are 'Done', return 0.
5.  **atRiskTasks**: Identify tasks that are NOT 'Done' and their 'dueDate' is within the next 3 days of '{{currentDate}}' or is already in the past.
6.  **stalledTasks**: Identify tasks with a status of 'To Do' or 'In Progress' that have not been updated (using 'updatedAt') in over 7 days from '{{currentDate}}'.
7.  **proactiveSuggestions**: Based on all the data, provide 3-5 actionable, insightful suggestions. Be specific. Examples: "You have 3 high-priority tasks due this week. Consider breaking 'Task Title' into smaller sub-tasks to make progress." or "The task 'Stalled Task Title' hasn't been updated in 10 days. It might be blocked. Consider checking in on its status."

Analyze the following tasks:
{{{json tasks}}}
`,
});

const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: InsightGenerationInputSchema,
    outputSchema: AIInsightsSchema,
  },
  async (input) => {
    // Basic validation
    if (input.tasks.length === 0) {
      // In a real scenario, you might want more robust empty-state handling.
      // For this flow, we'll return a zeroed-out valid response.
      return {
        summary: "No task data provided for analysis. Start by adding some tasks to your planner!",
        productivityScore: 0,
        completionRate: { daily: 0, weekly: 0 },
        averageCompletionTimeHours: 0,
        atRiskTasks: [],
        stalledTasks: [],
        proactiveSuggestions: ["Add tasks to your list to get started.", "Set due dates to help with planning."]
      };
    }
    
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model failed to produce a valid insight report.");
    }

    return output;
  }
);
