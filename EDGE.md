# MiinPlanner edge candidates

MiinPlanner is only worth using if it beats "ask a general AI chat, paste the answer into a to-do list". A chat can write a plan. It can't see what your team actually did this week, who is overloaded, or which channel went quiet. Every candidate below is built on that: the calendar, teamwork and AI insights on the team's real tasks.

Nothing here gets built until Minh picks one (comment on the PR or send a message). Until then, runs ship usability, speed and reliability fixes only.

## Who we're building for
A small marketing team of 1 to 5 people: an owner who does marketing on the side, plus a freelancer, an assistant or a small agency crew. Typical week: a few social posts per channel, a newsletter, an ad tweak, a blog post, client or boss check-ins. Their real problems are not "what should I post" (a chat answers that). They are:
- Posting goes quiet on a channel for two weeks and nobody notices until the numbers drop.
- One person has everything due on Friday, another has nothing.
- The Monday check-in takes 20 minutes of scrolling to answer "what got done, what slipped, what's next".
- The same task gets pushed week after week and quietly dies.

## What we already have to build on
Tasks carry `channel`, `startDate`/`dueDate`, `assignedTo` (workspace boards), `status`, `completedAt` and `createdAt`. The calendar shows titles by priority and hides done work (PR #18). Workspaces share a board with members (Teamwork). The companion works out a momentum score in code and does up to 3 AI check-ins a day (PR #22, #23). There is no history of edits yet: we don't know how often a due date moved.

---

## 1. Monday team recap (recommended first)
- **Who it helps:** the owner or team lead who runs a weekly check-in, in person or in Slack/Zalo.
- **The job:** in one click, get "last week: done, slipped; this week: due, by person" as text ready to paste into the team chat.
- **Why a chat or generic planner can't:** a chat has no idea what the team did. Todoist or Trello can show the tasks, but someone still has to read the board and write the summary. Here the data is already in one place, so the recap is instant and correct.
- **Smallest test:** a "Copy week recap" button on the Teamwork page (and on the personal board). Built in code from the tasks, no AI: finished last 7 days per person, overdue per person, due in the next 7 days per person, grouped by channel. Optional one-line AI summary later, using the `insights` quota.
- **How we'd know it helps:** the same workspace copies a recap in 3 of 4 consecutive weeks. Track copy clicks per workspace per week.

## 2. Channel gaps on the calendar
- **Who it helps:** anyone posting on 2 or more channels (Instagram, Facebook, TikTok, email, blog).
- **The job:** see at a glance which channel has nothing planned in the next 2 weeks, before it goes quiet.
- **Why a chat or generic planner can't:** consistency is a calendar problem, not a writing problem. A chat can't see your schedule, and generic planners don't know a "channel" is something you're meant to keep alive.
- **Smallest test:** a channel filter and channel colour on the calendar, plus one line above it computed in code: "Nothing planned for Instagram next week" for any channel used in the last 30 days with no task due in the next 7 or 14 days. Click it to add a task on that channel with the date prefilled.
- **How we'd know it helps:** tasks get created from the gap line, and the number of channels with a gap goes down week over week for active users.

## 3. Who's on what this week
- **Who it helps:** a team lead assigning work to 2 to 5 people, including freelancers.
- **The job:** see each person's load for the week and spot overload or idle time before Friday.
- **Why a chat or generic planner can't:** a chat doesn't know who has what. Big tools (Asana, Monday) have workload views, but they're paid, heavy and built for larger teams. A small team needs one glance, not a resource planner.
- **Smallest test:** on a workspace board, a row of member chips with "N due this week, M overdue", red when someone has twice the team average. Click a chip to filter the calendar or board to that person. All computed in code.
- **How we'd know it helps:** tasks get reassigned within a day of a red chip, and leads open the filter more than once a week.

## 4. Stuck work, not just overdue work
- **Who it helps:** solo owners and teams alike; anyone whose plan quietly slides.
- **The job:** flag the tasks that keep getting pushed or sit untouched, and ask "do it, delegate it or drop it?"
- **Why a chat or generic planner can't:** it needs the history of your own tasks. A chat can't know a task moved three times. Generic planners show "overdue" but treat a task pushed five times the same as a fresh one.
- **Smallest test:** store a small counter when a due date moves later (`dueDateMoves`, no full history). Show a "Pushed 3 times" badge on cards and let the companion mention the worst one in its check-in. Three buttons on the badge: Do today, Assign, Archive (archive only, never delete).
- **How we'd know it helps:** flagged tasks get finished or archived within a week more often than unflagged overdue ones.

---

## Recommendation
Start with **1. Monday team recap**. It uses all three strengths at once (dates, people, insights on real work), it's a single button with no new data, and usage is easy to read: either a team pastes it every Monday or it doesn't. Candidate 2 is the strongest pick for solo owners and could follow.

## Not candidates (already decided)
- More plan generation. Quick plan stays small (PR #8).
- Promotion, popups or growth hooks.
- More companions or moods, until we see which companion people pick and whether check-ins get used.
