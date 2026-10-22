'use server';

/**
 * @fileOverview A short check-in from the user's companion, in that companion's voice.
 * The score and counts are worked out in code (src/lib/companion.ts) and passed in;
 * the model only writes the message and up to 3 next steps.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { runGuarded, type AiResult } from '@/ai/guard';
import { getCompanion } from '@/lib/companion';

const CheckInTaskSchema = z.object({
  title: z.string().max(200),
  priority: z.string().max(20),
  when: z.enum(['overdue', 'today', 'week', 'stalled']),
  dueDate: z.string().max(40).optional(),
  timesPushed: z.number().int().min(0).max(1000).optional(),
});

const CheckInInputSchema = z.object({
  companionId: z.enum(['mia', 'kai', 'theo', 'pip']),
  firstName: z.string().max(40),
  score: z.number().min(0).max(100).nullable(),
  mood: z.enum(['hello', 'sad', 'worried', 'okay', 'happy', 'love']),
  finishedWeek: z.number().int().min(0),
  finishedToday: z.number().int().min(0),
  activeDays: z.number().int().min(0).max(7),
  overdue: z.number().int().min(0),
  dueToday: z.number().int().min(0),
  slipsWeek: z.number().int().min(0).optional(),
  openTotal: z.number().int().min(0),
  tasks: z.array(CheckInTaskSchema).max(15),
  currentDate: z.string().max(40),
});
export type CheckInInput = z.infer<typeof CheckInInputSchema>;

const CheckInOutputSchema = z.object({
  message: z.string().describe('2 to 3 short sentences, under 60 words, in the companion voice.'),
  nextSteps: z.array(z.string()).describe('Up to 3 concrete next steps, each under 15 words, naming real tasks where possible.'),
});
export type CheckInOutput = z.infer<typeof CheckInOutputSchema>;

const PromptInputSchema = CheckInInputSchema.extend({
  companionName: z.string(),
  companionRole: z.string(),
  voice: z.string(),
  scoreText: z.string(),
});

/** Requires a Firebase ID token. Counts against the user's daily check-in quota (3). */
export async function companionCheckIn(idToken: string, input: CheckInInput): Promise<AiResult<CheckInOutput>> {
  const parsed = CheckInInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: 'failed', message: "Couldn't read your board for the check-in. Please try again." };
  }
  return runGuarded(idToken, 'checkin', () => checkInFlow(parsed.data));
}

const prompt = ai.definePrompt({
  name: 'companionCheckInPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: CheckInOutputSchema },
  prompt: `You are {{companionName}}, {{companionRole}}, a companion inside MiinPlanner, a planner for small business owners.
Your personality: {{voice}}

You are checking in on {{#if firstName}}{{firstName}}{{else}}the user{{/if}}. Today is {{currentDate}}.

Their momentum (worked out by the app, do not recalculate):
- Score: {{scoreText}}, mood: {{mood}}
- Finished in the last 7 days: {{finishedWeek}} (today: {{finishedToday}}), active days this week: {{activeDays}}
- Open tasks: {{openTotal}}, overdue: {{overdue}}, due today: {{dueToday}}
- Tasks pushed to a later date this week after they were already due: {{slipsWeek}}

Tasks that need attention (overdue, today, next 7 days, or not touched for over a week):
{{{json tasks}}}

Write a short check-in:
- "message": 2 to 3 short sentences, under 60 words, fully in your personality. React to their mood and numbers honestly.
- "nextSteps": up to 3 concrete next steps, each under 15 words. Name real tasks from the list. Overdue first, then today.

Rules:
- Stay supportive even when strict. Never guilt-trip, shame or threaten. No romance or flirting.
- Plain English. No em dashes. No markdown. No made-up tasks or numbers.
- If there are no tasks, suggest adding one or planning the week.
- If tasks were pushed ("timesPushed" or the weekly count above), mention it once, kindly, and ask whether the new date is realistic. Pushed is not done.`,
});

const checkInFlow = ai.defineFlow(
  { name: 'companionCheckInFlow', inputSchema: CheckInInputSchema, outputSchema: CheckInOutputSchema },
  async (input) => {
    const c = getCompanion(input.companionId);
    const { output } = await prompt({
      ...input,
      slipsWeek: input.slipsWeek ?? 0,
      companionName: c.name,
      companionRole: c.role,
      voice: c.voice,
      scoreText: input.score === null ? 'not started yet (nothing finished so far)' : `${input.score} out of 100`,
    });
    if (!output) throw new Error('The AI model returned no check-in.');
    return {
      message: output.message.replace(/—/g, ',').trim().slice(0, 500),
      nextSteps: (output.nextSteps || []).slice(0, 3).map(s => s.replace(/—/g, ',').trim().slice(0, 160)),
    };
  },
);
