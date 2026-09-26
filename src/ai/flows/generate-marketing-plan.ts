'use server';

/**
 * @fileOverview Generates a practical, dated marketing plan for a small business.
 * The output is a list of tasks the user can add straight to their MiinPlanner board.
 *
 * - generateMarketingPlan - Server action that returns a plan with dated tasks.
 * - MarketingPlanInput / MarketingPlan - Input and output types.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PLAN_DURATIONS = [7, 14, 30] as const;
const MAX_TASKS = 30;

const MarketingPlanInputSchema = z.object({
  businessType: z.string().trim().min(2).max(120)
    .describe('What the business is, e.g. "neighbourhood bakery in Hanoi".'),
  goal: z.string().trim().min(3).max(300)
    .describe('The main marketing goal for this period.'),
  audience: z.string().trim().max(200).optional()
    .describe('Who the business wants to reach.'),
  channels: z.array(z.string().trim().min(1).max(40)).min(1).max(8)
    .describe('Marketing channels the business can realistically use.'),
  durationDays: z.number().int().refine(d => (PLAN_DURATIONS as readonly number[]).includes(d), {
    message: 'Duration must be 7, 14 or 30 days.',
  }),
  hoursPerWeek: z.number().int().min(1).max(40).default(5)
    .describe('Time the owner can spend on marketing each week.'),
});
export type MarketingPlanInput = z.input<typeof MarketingPlanInputSchema>;

const PlanTaskSchema = z.object({
  title: z.string().describe('Short, action-first task title, max ~70 characters.'),
  description: z.string().describe('2-3 sentences: exactly what to do and what "done" looks like.'),
  channel: z.string().describe('One of the channels provided, or "General" for setup and review tasks.'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  dayOffset: z.number().int().describe('Day in the plan this task is due, 0 = first day.'),
  tags: z.array(z.string()).describe('1-3 lowercase tags, e.g. "content", "setup", "review".'),
});

const MarketingPlanSchema = z.object({
  planName: z.string().describe('A short name for this plan.'),
  summary: z.string().describe('2-3 sentence overview of the strategy behind the plan.'),
  tasks: z.array(PlanTaskSchema),
});
export type MarketingPlan = z.infer<typeof MarketingPlanSchema>;
export type MarketingPlanTask = MarketingPlan['tasks'][number];

const PromptInputSchema = MarketingPlanInputSchema.extend({
  channelList: z.string(),
  maxTasks: z.number(),
  lastDay: z.number(),
});

const prompt = ai.definePrompt({
  name: 'generateMarketingPlanPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: MarketingPlanSchema },
  prompt: `You are a hands-on marketing consultant for small businesses with no marketing team.
Build a {{durationDays}}-day marketing plan the owner can actually execute.

Business: {{{businessType}}}
Goal: {{{goal}}}
{{#if audience}}Audience: {{{audience}}}{{/if}}
Channels available: {{{channelList}}}
Time available: about {{hoursPerWeek}} hours per week

Rules:
- Return at most {{maxTasks}} tasks. Fit the total effort into the time available; fewer, better tasks beat a long list.
- Every task must be concrete and doable in one sitting (under 2 hours). Bad: "Improve social media". Good: "Post 3 behind-the-scenes photos of morning baking on Instagram".
- Start with 1-3 setup tasks (e.g. fix profile info, set up tracking) in the first days, then spread recurring content across the period, and end with a review task that checks results against the goal.
- Only use the channels listed, plus "General" for setup and review tasks.
- Reference the specific business and audience in titles and descriptions. No generic filler.
- dayOffset must be between 0 and {{lastDay}}. Spread tasks realistically; don't stack more than 3 on one day.
- Mark only the tasks that directly drive the goal as High or Urgent.`,
});

const generateMarketingPlanFlow = ai.defineFlow(
  {
    name: 'generateMarketingPlanFlow',
    inputSchema: MarketingPlanInputSchema,
    outputSchema: MarketingPlanSchema,
  },
  async (input) => {
    const lastDay = input.durationDays - 1;
    const { output } = await prompt({
      ...input,
      channelList: input.channels.join(', '),
      maxTasks: input.durationDays === 7 ? 10 : input.durationDays === 14 ? 18 : MAX_TASKS,
      lastDay,
    });
    if (!output) {
      throw new Error('The AI model did not return a plan.');
    }

    // Never trust model output blindly: clamp days, cap count, tidy tags.
    const tasks = output.tasks
      .filter(t => t.title?.trim())
      .slice(0, MAX_TASKS)
      .map(t => ({
        ...t,
        title: t.title.trim().slice(0, 120),
        description: (t.description || '').trim().slice(0, 600),
        dayOffset: Math.min(Math.max(Math.round(t.dayOffset || 0), 0), lastDay),
        tags: (t.tags || []).map(tag => tag.toLowerCase().trim()).filter(Boolean).slice(0, 3),
      }))
      .sort((a, b) => a.dayOffset - b.dayOffset);

    return { ...output, tasks };
  }
);

export async function generateMarketingPlan(input: MarketingPlanInput): Promise<MarketingPlan> {
  return generateMarketingPlanFlow(MarketingPlanInputSchema.parse(input));
}
