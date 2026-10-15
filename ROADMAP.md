# MiinPlanner roadmap

Ordered by priority. One item per PR unless items are tiny. Tick items off when merged.

## Now: fix the risks
- Nothing open. Add new risks here.

## Direction (October 2026)
MiinPlanner proves MiinDigital can ship a useful product. The plan generator is not the hook: a general AI chat gives the same plan. The edge is what needs a real tool: the calendar, teamwork (shared boards, assigning, seeing what teammates do) and AI insights on the team's actual work. Test for every change: would a small business owner get this faster or better here than from a chat plus a to-do list? No promotion, popups or growth hooks in the app.

## Now: boards that show what to do next (from Minh, 15 Oct 2026)
The Kanban, list and calendar views give every task the same weight, so they don't say where to start. Rule for all views: what needs you now comes first, finished work steps back. Time groups (Overdue, Today, This week, Later, No date) are computed from the due date, never stored; statuses stay as the workflow.
- [ ] Sorting rule plus Kanban: sort cards by time group then priority (keep a "My order" option), collapse the finished column to a slim summary, date badges for overdue and today.
- [ ] List view: group rows by time group, finished tasks in a collapsed "Completed" section, Assignee only on workspace boards, Channel only when used.
- [ ] Calendar: task titles coloured by priority, overdue in red, finished tasks faded with a "Hide done" toggle, "Next up" in the side panel when a day is empty.
- [ ] "Up next" strip above all views: the top 3 open tasks with one-click done.

## Next: make the calendar, teamwork and insights genuinely good
- [ ] Write `EDGE.md`: 3 to 5 candidate edges on the calendar, teamwork and AI insights (who it helps, the job, why a chat or generic planner can't do it, smallest test, how we'd know). Minh picks one before anything is built.
- Until an edge is picked: usability, speed and reliability fixes to the calendar, teamwork and insights flows (see Later).

## Parked (plan generator is no longer the front door)
- Send new users straight to `/planner` after signup.
- Deep link `/planner?business=...&goal=...` pre-fill.
- "Plan my marketing" card on the dashboard.
- GA4 funnel events (`sign_up`, `plan_generated`, `plan_added`, `cta_miindigital_click`). Revisit as product analytics once an edge ships.

## Later: clean up
- [ ] Reminders, next steps if the calendar feed gets used: a daily email digest (due today, overdue, assigned to you) needs an email provider and Cloud Scheduler; browser push needs a service worker and FCM.
- [ ] **Pin the `miinplanner` database.** Add `firebase.json` (and `.firebaserc`) so `firebase deploy --only firestore:rules` targets the `miinplanner` database, not `(default)`. Share one database ID constant between `src/lib/firebase.ts` and `src/lib/firebase-admin.ts`. Note the named database in CLAUDE.md.
- [ ] Delete stub routes: `/chatbot`, `/calendar`, `/reminders`, `/prioritization`, and `src/ai/flows/prioritize-tasks-flow.ts`, `generate-content-ideas.ts`.
- [ ] AI Insights: compute completion rate, averages and overdue lists in code; use the model only for the summary and suggestions.
- [ ] Fix the remaining 9 TypeScript errors and remove `ignoreBuildErrors`.
- [ ] Replace the Firebase Studio README.
- [ ] Show remaining AI uses from the server count (`aiUsage/{uid}`, via a small server action) instead of the client-written counters on `users/{uid}`, which a user can edit. Server limits reset at midnight UTC; the UI uses local time.
- [ ] Turn on App Check (reCAPTCHA Enterprise) for extra protection against scripted signups calling the AI actions.
- [ ] Remove the `console.log("Firebase Config Used by App")` in `src/lib/firebase.ts`.
- [ ] Teamwork: after inviting or removing a member, `currentWorkspace` keeps the old `memberUids`, so the member list can go stale until reload. Refresh `currentWorkspace` from `fetchWorkspaces`.

## Done
- [x] Finished status: each board marks one status as finished (Settings, Statuses), default "Done" or the last status. It can't be deleted while marked, and reordering no longer changes what counts as done. Every status change writes `completed` and `completedAt`; a one-time sync fixes old tasks. Board, list, dashboard, insights, confetti and the calendar feed all use the same rule. PR #14
- [x] Plan with AI: paste a plan from ChatGPT, Claude or any AI (prompt with one-click open in ChatGPT/Claude, forgiving parser for tables, lists, CSV and JSON, tick list, dated tasks). Reminders featured in Task Manager (banner plus header button). PR #11
- [x] Reminders via a private calendar feed (Settings > Reminders): tasks with due dates appear in Google, Apple or Outlook Calendar with 9am alerts, plus a day-before alert for high and urgent. PR #10
- [x] Themes work everywhere and survive reloads (light palettes were being dropped from the production CSS, and the settings page wiped dark mode). Added warmth: colored priority pills and card stripes, overdue and today dates, status dots, a confetti burst and "N to go" toast when a task is done. PR #9
- [x] Quick plan: the plan generator now returns 5 to 7 tasks, has a shorter form, a flat tick list, and sits at the bottom of the nav as "Quick plan" instead of being the headline. PR #8
- [x] Closed the user list leak: users can only read their own `users/{uid}` doc. Invite by email and member names now go through server actions (`src/services/workspace-members-actions.ts`). Needs the new `firebase.rules` deployed. PR #6
- [x] Gemini server actions verify the Firebase ID token and enforce daily limits server-side (`aiUsage/{uid}`, plan 3, chat 10, insights 10). PR #5
- [x] Template library rebuilt: 8 marketing playbooks with dated tasks, preview, "Add to board" (append) and optional replace. PR #4
- [x] Loading a template, saved space or import only replaces the personal board (never workspace tasks), backs it up to Saved Spaces first, and aborts if the backup fails. PR #3
- [x] AI Marketing Planner (`/planner`), PR #1, 26 Sep 2026
