
'use server';
/**
 * @fileOverview AI flow to prioritize tasks based on their properties.
 *
 * - prioritizeTasks - A function that takes tasks and returns them with suggested priorities.
 * - PrioritizeTasksInput - The input type for the prioritizeTasks function.
 * - PrioritizeTasksOutput - The return type for the prioritizeTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Task, AIPrioritizedTask } from '@/types';

// Using a subset of Task fields relevant for prioritization
const TaskForPrioritizationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  dueDate: z.string().optional().describe("ISO date string for the due date, if any."),
  tags: z.array(z.string()).optional().describe("Tags associated with the task, e.g., 'SEO', 'Social Media', 'Urgent'.")
});

const PrioritizeTasksInputSchema = z.object({
  tasks: z.array(TaskForPrioritizationSchema).describe("An array of tasks to be prioritized."),
  // Optionally, add campaignGoals or userHistory context here in the future
  // campaignGoals: z.string().optional().describe("Overall campaign goals to consider for prioritization."),
});
export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

const PrioritizedTaskSchema = TaskForPrioritizationSchema.extend({
  suggestedPriority: z.enum(['Low', 'Medium', 'High']).optional().describe("The AI's suggested priority for the task."),
  reasoning: z.string().optional().describe("A brief explanation for the suggested priority.")
});
export type PrioritizedTask = z.infer<typeof PrioritizedTaskSchema>;


const PrioritizeTasksOutputSchema = z.object({
  prioritizedTasks: z.array(PrioritizedTaskSchema).describe("An array of tasks with AI-suggested priorities and reasoning. The order of tasks in this array can also represent a suggested new order."),
});
export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;

export async function prioritizeTasks(
  input: PrioritizeTasksInput
): Promise<PrioritizeTasksOutput> {
  return prioritizeTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prioritizeTasksPrompt',
  input: {schema: PrioritizeTasksInputSchema},
  output: {schema: PrioritizeTasksOutputSchema},
  prompt: `You are an expert project manager and task prioritization assistant.
You will be given a list of tasks. Your goal is to analyze these tasks and suggest a new priority ('Low', 'Medium', 'High') for each, along with a brief reasoning.
Consider the following factors for prioritization:
1.  Due Dates: Tasks with earlier due dates are generally more urgent.
2.  Existing Priority: Take the current user-set priority as a strong hint. Deviate if other factors strongly suggest it.
3.  Tags: Tags like 'Urgent', 'Important', 'Critical' should significantly increase priority. Tags like 'SEO', 'Social Media' indicate task category, which might relate to broader goals (though specific campaign goals are not provided in this version).
4.  Task Title and Description: Keywords in the title or description might indicate urgency or importance (e.g., "fix critical bug", "launch campaign").

For each task, provide its original details, your 'suggestedPriority', and a concise 'reasoning'.
If you believe the existing priority is appropriate, you can suggest the same priority.
The overall order of the tasks in your 'prioritizedTasks' output array should also reflect a sensible order of execution, with more critical/urgent tasks appearing earlier in the list.

Tasks to prioritize:
{{#each tasks}}
- Task ID: {{id}}
  Title: {{{title}}}
  Description: {{{description}}}
  Current Priority: {{priority}}
  Due Date: {{dueDate}}
  Tags: {{#if tags}}{{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
{{/each}}
`,
});

const prioritizeTasksFlow = ai.defineFlow(
  {
    name: 'prioritizeTasksFlow',
    inputSchema: PrioritizeTasksInputSchema,
    outputSchema: PrioritizeTasksOutputSchema,
  },
  async (input) => {
    // In a more advanced version, you could fetch campaignGoals or userHistory here.
    const {output} = await prompt(input);
    
    if (!output || !output.prioritizedTasks) {
        // Fallback: if AI fails to provide output, return original tasks without changes.
        // This should ideally not happen if the prompt and model are robust.
        return { prioritizedTasks: input.tasks.map(task => ({...task, reasoning: "AI prioritization failed, using original."})) };
    }
    return output;
  }
);
