# MiinPlanner

Free AI marketing planner for small business owners, built by Minh Pham (MiinDigital).
Live app: https://planner.miindigital.com. Promo page: https://miindigital.com/miinplanner/ (WordPress, not in this repo).

## Why it exists
MiinPlanner is a lead magnet for MiinDigital's services, not a standalone SaaS. It should not compete with Todoist/Trello as a generic task manager.
Its edge is the **AI Marketing Planner** (`/planner`): business + goal gives you a dated marketing plan on your board. New work should strengthen that loop:
promo page or free tool, then signup, then first plan, then tasks done, then "Talk to MiinDigital".

## Stack
- Next.js 15 (App Router), React 18, Tailwind, shadcn/ui (`src/components/ui`)
- Firebase Auth + Firestore (client SDK, `src/lib/firebase.ts`), rules in `firebase.rules`
- Genkit + Gemini 2.5 Flash (`src/ai/genkit.ts`, flows in `src/ai/flows`, all `'use server'`)
- Firebase App Hosting, config in `apphosting.yaml`. `GOOGLE_API_KEY` is a secret.

## How we work
- **Never push to `main`.** `main` auto-deploys to production. Work on a branch (`feature/...`, `fix/...`, `docs/...`) and open a PR. Minh merges.
- Before opening a PR: `npx tsc --noEmit` must not add errors (baseline is 9 pre-existing; the build ignores them via `ignoreBuildErrors`), and `npx next build` must pass.
  For a local build, create `.env.local` from the `NEXT_PUBLIC_*` values in `apphosting.yaml` (they are public by design). Never commit `.env*`.
- AI flows can't be tested without the Gemini key. Say so in the PR and ask Minh to test on production after merging.
- Additive changes over rewrites. Never write code that deletes a user's tasks without explicit confirmation.
- PR descriptions: what changed, files, checks run, what was not tested, known issues.

## Writing style for UI copy and PRs
Concise, direct, plain English. No em dashes. No filler. Sentence case for headings and buttons.

## Data model (Firestore)
- `tasks/{id}`: `userId`, optional `workspaceId`, `status` (free text, matches the user's or workspace's status list), `priority`, `startDate`/`dueDate` (Timestamps), `channel`, `tags`, `order`.
- `users/{uid}`: profile, `taskStatuses`, daily AI usage counters (`chatbotMessageCount`, `marketingPlanCount`, and `last...Date` fields).
- `users/{uid}/taskSpaces/{id}`: saved boards (task snapshots).
- `workspaces/{id}`: `ownerId`, `memberUids`, `taskStatuses`.
- `aiUsage/{uid}`: server-only daily AI counters (`date` in UTC, `plan`, `chat`, `insights`), written by `src/ai/guard.ts` with firebase-admin. No client access.

## AI server actions
Every exported action in `src/ai/flows` takes a Firebase ID token first and wraps the model call in `runGuarded` from `src/ai/guard.ts`. It returns `{ ok, data }` or `{ ok: false, code, message }` because Next.js hides thrown messages in production.

## Backlog
See `ROADMAP.md`. Pick from the top unless Minh says otherwise, and tick items off in the same PR that ships them.
