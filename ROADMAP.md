# MiinPlanner roadmap

Ordered by priority. One item per PR unless items are tiny. Tick items off when merged.

## Now: fix the risks
- [ ] Phones: the Kanban board is hard to scroll because any swipe on a card starts a drag (from Minh, 16 Oct 2026). Cause: `kanban-board.tsx` uses one `PointerSensor` with `distance: 8`, so 8px of finger movement picks up the card. Fix: `MouseSensor` (distance 8) for desktop plus `TouchSensor` with `delay: 250, tolerance: 5`, so a swipe scrolls and a press-and-hold drags. Add `touch-action: manipulation` on cards if needed, and test on a real phone.
- [x] Saving the current board to Saved Spaces works again: empty optional fields (channel, dates, workspace) were sent as `undefined`, which Firestore rejects, and the write wasn't awaited, so it looked saved when it wasn't. Now cleaned, awaited, with a success or error toast. PR #21

## Direction (October 2026)
MiinPlanner proves MiinDigital can ship a useful product. The plan generator is not the hook: a general AI chat gives the same plan. The edge is what needs a real tool: the calendar, teamwork (shared boards, assigning, seeing what teammates do) and AI insights on the team's actual work. Test for every change: would a small business owner get this faster or better here than from a chat plus a to-do list? No promotion, popups or growth hooks in the app.

## Now: companion (from Minh, 16 Oct 2026)
AI Insights was undersold. The point is to keep people company while they work: a companion with a personality whose mood follows how the board is going.
- [x] Companion replaces AI Insights. Four original companions (Mia the bestie, Kai the coach, Theo the mentor, Pip the hype buddy) with their own faces and six moods. Momentum score out of 100 worked out in code from the board (getting things done 50, showing up 30, today 20), so the mood is live and free. Small companion box next to Up next in the Task Manager. Companion page: score breakdown, what the companion is watching, picker, and up to 3 short AI check-ins a day in the companion's voice (`checkin` quota). `/insights` redirects to `/companion`. Rule in `src/lib/companion.ts`. PR #22
- [x] Companion fixes: the Miin assistant (a glossy helmet head with ear fins, headphone pods and big shiny eyes) replaces the human faces, in four colours: Miin Buddy, Miin Coach, Miin Mentor, Miin Hype. Switching is instant (the profile loader was dropping `companionId`, and also the personal `doneStatus`). Check-ins show how many are left today, from the server count. The chat is now "Chat with Miin Buddy" and answers in the companion's voice. PR #23
- [ ] Watch which companion people pick and whether check-ins get used before adding more companions or moods.

## Now: boards that show what to do next (from Minh, 15 Oct 2026)
The Kanban, list and calendar views give every task the same weight, so they don't say where to start. Rule for all views: what needs you now comes first, finished work steps back. Time groups (Overdue, Today, This week, Later, No date) are computed from the due date, never stored; statuses stay as the workflow.

## Paid option (parked, from Minh 15 Oct 2026)
Ship a good free product first; keep the option to charge later. No Vietnamese version. A greyed-out "Pro" card sits in Settings > Plan & Billing (no button, no sign-up). First idea if it happens: a small one-time price (around $3) for premium themes. The planner itself stays free. Plan doc: https://claude.ai/code/artifact/1f7e2265-cf8c-40fc-912c-38adf5c9a2ea

## Now: personal and team boards (from Minh, 22 Oct 2026)
Two boards, one "me". Boards stay separate (personal is private, the team board is shared, each has its own statuses). What is about the board exists on both. What is about you (Up next, companion, reminders) looks across both: your personal tasks plus team tasks assigned to you, read in place, never copied.
- [x] 1. Team board catch-up: search and filters (plus Assignee: Me, members, Unassigned), archived view, task detail view, phone card list, empty board, compact members row with Invite popup and confirm before removing. PR #29
- [x] 2. Team hub: pinned links (title, URL, icon; remove asks first) as chips under the board title, and one shared team note ("how we work": rules, brand voice, approvals) with "Edited by X". Any member can edit; likely needs a Firestore rules update. PR #32
- Parked (Minh, 22 Oct 2026): Up next and the companion counting team tasks assigned to you. Boards stay fully separate for now; mixing them in one place would make people think everything is blended. The daily email still lists assigned team tasks, labelled with the team name.
- [x] 4. Pushed dates count, on both boards. PR #34
- [ ] 5. Who's on what this week (EDGE.md candidate 3).
- [ ] Maybe later: "Show my team tasks" switch on the personal calendar, off by default.

## Next: make the calendar, teamwork and insights genuinely good
- [x] Minh picked edge 1, Monday team recap (PR #27).
- [ ] Browser push reminders (FCM and a service worker) for at-the-moment nudges; works on Android Chrome, on iPhone only when added to the Home Screen.
- Until an edge is picked: usability, speed and reliability fixes to the calendar, teamwork and insights flows (see Later).

## Parked (plan generator is no longer the front door)
- Send new users straight to `/planner` after signup.
- Deep link `/planner?business=...&goal=...` pre-fill.
- "Plan my marketing" card on the dashboard.
- [x] GA4 basics on (Oct 2026): Firebase Analytics page views plus `sign_up`, `first_task_added`, `plan_imported`. Other funnel events (`plan_generated`, `cta_miindigital_click`) stay parked until an edge ships.

## Later: clean up
- [ ] Week recap: once Analytics (PR #25) is merged, log `recap_opened` and `recap_copied` so we can see if teams use it weekly (the EDGE.md success test: copied in 3 of 4 weeks).
- [ ] Daily email: one-click "Mark done" links (needs a signed token per task and a confirm page, since mail scanners open links).
- [ ] **Pin the `miinplanner` database.** Add `firebase.json` (and `.firebaserc`) so `firebase deploy --only firestore:rules` targets the `miinplanner` database, not `(default)`. Share one database ID constant between `src/lib/firebase.ts` and `src/lib/firebase-admin.ts`. Note the named database in CLAUDE.md.
- [ ] Delete stub routes: `/chatbot`, `/calendar`, `/reminders`, `/prioritization`, and `src/ai/flows/prioritize-tasks-flow.ts`, `generate-content-ideas.ts`.
- [ ] Fix the remaining 6 TypeScript errors and remove `ignoreBuildErrors`.
- [ ] Replace the Firebase Studio README.
- [ ] Show remaining AI uses from the server count (`aiUsage/{uid}`, via a small server action) instead of the client-written counters on `users/{uid}`, which a user can edit. Server limits reset at midnight UTC; the UI uses local time.
- [ ] Turn on App Check (reCAPTCHA Enterprise) for extra protection against scripted signups calling the AI actions.
- [ ] Teamwork: after inviting or removing a member, `currentWorkspace` keeps the old `memberUids`, so the member list can go stale until reload. Refresh `currentWorkspace` from `fetchWorkspaces`.

## Done
- [x] Pushed dates count (from Minh, 21 Oct 2026): moving an open task that was overdue, due today or tomorrow to a later day is a slip (not for fresh tasks or tasks still days away). Toast "Moved to Thu. Counted as a slip" with "It was a date fix" to undo, and a note when the new day has 5+ open tasks. Cards show "Pushed N times" from the second push; the detail view shows the count and first due date. A slip in the last 7 days counts as half an overdue task in the momentum score, the companion names pushed work instead of a rosy line, and AI check-ins see it. Fields `slipCount`, `lastSlipAt`, `firstDueDate` on tasks; rule in `src/lib/slips.ts`. PR #34
- Later: flag overloaded days on the calendar itself, not just in the toast.
- [x] Team hub (step 2 above): pinned links as chips under the team board title (icon by site, remove asks first, up to 20) and one shared team note with "Edited by X", live for all members. Saving checks nobody else saved meanwhile, so no one's words get overwritten. Data in `workspaces/{id}/links` and `workspaces/{id}/hub/notes`; rules let any member edit. Needs the new `firebase.rules` published. PR #32
- [x] Slim filter toolbar on both boards (from Minh, 22 Oct 2026: filters are a secondary tool, the old filter card took too much space, especially on phones). One row: search, one Filter button (all filters and archived in one panel, with a count), Mine on team boards, view switch; active filters show as removable chips. Phone headers use icon buttons; the Teamwork workspace picker is one row with + for a new workspace. PR #31
- [x] New boards start with three statuses: To Do, In Progress, Done (from Minh, 22 Oct 2026). Applies to new users and new team workspaces (which no longer copy the creator's personal list). Existing boards untouched; the old five-status list stays only as the fallback for old accounts that never saved one. PR #30
- [x] Team board catch-up (step 1 above). Filters are one shared component (`src/components/tasks/TaskFilters.tsx`) for both boards; fixed the filter rows toggling twice when clicking the label. TypeScript baseline now 6. PR #29
- [x] Daily email reminder (from Minh, 21 Oct 2026; the calendar feed's alerts don't fire on Android): Brevo email from planner@miindigital.com at 7:30am local by default (6, 7, 7:30, 8 or 9am in Settings > Reminders), only on days with something due today or overdue in the last 14 days, plus high and urgent tasks due tomorrow. On for everyone, with one-click unsubscribe; stops for people who haven't opened the app in 30 days; verified emails only; daily cap under Brevo's free 300. Cloud Scheduler calls `/api/digest/run` every 30 minutes. Rules in `src/lib/email-digest.ts`. PR #28
- [x] `EDGE.md`: 4 candidate edges on the calendar, teamwork and AI insights (Monday team recap, channel gaps, who's on what, stuck work), each with who it helps, the job, why a chat can't, smallest test and how we'd know. PR #26
- [x] Dashboard retired: the app opens on the Task Manager (old /dashboard links redirect). "Up next" sits above every view: the 3 open tasks to do first (overdue, today, next 7 days) with one-click finish and a count summary. Empty boards show a welcome with Add a task, Paste a plan and Browse playbooks. Unused dashboard components removed; TypeScript baseline now 8. PR #20
- [x] Edge 1, Monday team recap (smallest version): a "Week recap" button on Teamwork and the Task Manager shows done in the last 7 days, slipped (overdue, with days late) and due in the next 7 days, by person on workspace boards, with one-click copy for the team chat. Built in code, no AI. Rule in `src/lib/week-recap.ts`. PR #27
- [x] Greyed-out "Pro" card in Settings > Plan & Billing (premium themes), and "free tool" copy changed to "free to use". PR #19
- [x] Calendar shows what's coming: task titles in each day coloured by priority, overdue in red, finished tasks hidden by default ("Hide done" switch, remembered per browser) or shown faded and struck through. Today, previous and next buttons replace the hidden month picker, and months that need six rows now show every day. Side panel: the day's tasks, open first; today also lists anything overdue; an empty day shows Overdue and the next 3 tasks. Phones show coloured dots. Also removed the Firebase config console log. PR #18
- [x] List view shows what to do next: rows grouped under Overdue, Today, Next 7 days, Later and No due date (with counts), finished tasks in a collapsed "Completed" section, archived in their own collapsed section. Assignee only on workspace boards or when someone is assigned; Channel only when a task uses it. Same grouping on the phone card list. Also fixed the double scroll bar on the Kanban board. PR #17
- [x] Kanban shows what to do next: open columns sort Overdue, Today, Next 7 days, Later, No date, then by priority, with small group labels ("Due first", or "Date added" as before). The finished column collapses to a slim summary (finished in the last 7 days, last 3 titles, still a drop target); expanded, it shows the last 7 days with "Show N older". Choices are remembered per browser. Rule in `src/lib/task-buckets.ts`. PR #15
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
