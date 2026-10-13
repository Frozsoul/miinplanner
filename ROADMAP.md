# MiinPlanner roadmap

Ordered by priority. One item per PR unless items are tiny. Tick items off when merged.

## Now: fix the risks
- Nothing open. Add new risks here.

## Direction (October 2026)
MiinPlanner proves MiinDigital can ship a useful product. The plan generator is not the hook: a general AI chat gives the same plan. The edge is what needs a real tool: the calendar, teamwork (shared boards, assigning, seeing what teammates do) and AI insights on the team's actual work. Test for every change: would a small business owner get this faster or better here than from a chat plus a to-do list? No promotion, popups or growth hooks in the app.

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
- [x] Reminders via a private calendar feed (Settings > Reminders): tasks with due dates appear in Google, Apple or Outlook Calendar with 9am alerts, plus a day-before alert for high and urgent. PR #10
- [x] Quick plan: the plan generator now returns 5 to 7 tasks, has a shorter form, a flat tick list, and sits at the bottom of the nav as "Quick plan" instead of being the headline. PR #8
- [x] Closed the user list leak: users can only read their own `users/{uid}` doc. Invite by email and member names now go through server actions (`src/services/workspace-members-actions.ts`). Needs the new `firebase.rules` deployed. PR #6
- [x] Gemini server actions verify the Firebase ID token and enforce daily limits server-side (`aiUsage/{uid}`, plan 3, chat 10, insights 10). PR #5
- [x] Template library rebuilt: 8 marketing playbooks with dated tasks, preview, "Add to board" (append) and optional replace. PR #4
- [x] Loading a template, saved space or import only replaces the personal board (never workspace tasks), backs it up to Saved Spaces first, and aborts if the backup fails. PR #3
- [x] AI Marketing Planner (`/planner`), PR #1, 26 Sep 2026
