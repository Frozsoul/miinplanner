# MiinPlanner roadmap

Ordered by priority. One item per PR unless items are tiny. Tick items off when merged.

## Now: fix the risks
- [ ] **Close the user list leak.** `firebase.rules` lets any signed-in user list all `/users` docs, and with them every email. Look up teammates by exact email through a server action instead.

## Next: make the planner the front door
- [ ] Send new users (no tasks yet) straight to `/planner` after signup instead of the dashboard.
- [ ] Deep link support: `planner.miindigital.com/planner?business=...&goal=...` pre-fills the form, so the promo page and blog posts can hand over context. The page must survive the login redirect.
- [ ] Add a "Plan my marketing" card on the dashboard for users who haven't generated a plan yet.
- [ ] Track key events in GA4 (`sign_up`, `plan_generated`, `plan_added`, `cta_miindigital_click`) so we can see the funnel.

## Later: clean up
- [ ] Delete stub routes: `/chatbot`, `/calendar`, `/reminders`, `/prioritization`, and `src/ai/flows/prioritize-tasks-flow.ts`, `generate-content-ideas.ts`.
- [ ] AI Insights: compute completion rate, averages and overdue lists in code; use the model only for the summary and suggestions.
- [ ] Fix the remaining 9 TypeScript errors and remove `ignoreBuildErrors`.
- [ ] Replace the Firebase Studio README.
- [ ] Show remaining AI uses from the server count (`aiUsage/{uid}`, via a small server action) instead of the client-written counters on `users/{uid}`, which a user can edit. Server limits reset at midnight UTC; the UI uses local time.
- [ ] Turn on App Check (reCAPTCHA Enterprise) for extra protection against scripted signups calling the AI actions.
- [ ] Remove the `console.log("Firebase Config Used by App")` in `src/lib/firebase.ts`.

## Done
- [x] Gemini server actions verify the Firebase ID token and enforce daily limits server-side (`aiUsage/{uid}`, plan 3, chat 10, insights 10). PR #5
- [x] Template library rebuilt: 8 marketing playbooks with dated tasks, preview, "Add to board" (append) and optional replace. PR #4
- [x] Loading a template, saved space or import only replaces the personal board (never workspace tasks), backs it up to Saved Spaces first, and aborts if the backup fails. PR #3
- [x] AI Marketing Planner (`/planner`), PR #1, 26 Sep 2026
