# MiinPlanner roadmap

Ordered by priority. One item per PR unless items are tiny. Tick items off when merged.

## Now: fix the risks
- [ ] **Stop templates and saved spaces wiping tasks.** `applyTasksToUser` deletes every task where `userId == user`, including tasks inside shared workspaces. Loading a template should add to the board, or at minimum only replace tasks in the current personal board, after a clear confirmation.
- [ ] **Protect the Gemini endpoints.** The server actions in `src/ai/flows` have no auth check, and the daily limits only run in the browser. Verify the Firebase ID token on the server (firebase-admin), enforce limits there, or turn on App Check.
- [ ] **Close the user list leak.** `firebase.rules` lets any signed-in user list all `/users` docs, and with them every email. Look up teammates by exact email through a server action instead.

## Next: make the planner the front door
- [ ] Send new users (no tasks yet) straight to `/planner` after signup instead of the dashboard.
- [ ] Deep link support: `planner.miindigital.com/planner?business=...&goal=...` pre-fills the form, so the promo page and blog posts can hand over context. The page must survive the login redirect.
- [ ] Add a "Plan my marketing" card on the dashboard for users who haven't generated a plan yet.
- [ ] Track key events in GA4 (`sign_up`, `plan_generated`, `plan_added`, `cta_miindigital_click`) so we can see the funnel.

## Later: clean up
- [ ] Delete stub routes: `/chatbot`, `/calendar`, `/reminders`, `/prioritization`, and `src/ai/flows/prioritize-tasks-flow.ts`, `generate-content-ideas.ts`.
- [ ] Replace off-topic templates (savings challenge, write a book, fitness) with marketing ones: product launch, Tet campaign, Google Business Profile setup, grand opening.
- [ ] AI Insights: compute completion rate, averages and overdue lists in code; use the model only for the summary and suggestions.
- [ ] Fix the 57 TypeScript errors and remove `ignoreBuildErrors`.
- [ ] Replace the Firebase Studio README.

## Done
- [x] AI Marketing Planner (`/planner`), PR #1, 26 Sep 2026
