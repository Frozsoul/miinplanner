/**
 * @fileOverview Turn a plan pasted from ChatGPT, Claude or Gemini into tasks.
 *
 * We give the user a prompt that asks for a markdown table. People paste the answer in
 * many shapes, so the parser accepts: markdown tables, tab-separated rows (copying a
 * rendered table), CSV, and a JSON array. Pure functions, no dependencies.
 */

import type { TaskPriority } from "@/types";

export const MAX_IMPORTED_TASKS = 60;

export type ParsedPlanTask = {
  title: string;
  description: string;
  channel: string;
  priority: TaskPriority;
  /** Days after the start date (0 = start). Null when the row gave an exact date. */
  dayOffset: number | null;
  /** Exact date (YYYY-MM-DD) when the row gave one instead of a day number. */
  date: string | null;
};

export type ParseResult = { tasks: ParsedPlanTask[]; skipped: number };

export function buildPlanPrompt(business: string, goal: string, days: number): string {
  const b = business.trim() || "[describe your business]";
  const g = goal.trim() || "[your main marketing goal]";
  return `You are a practical marketing consultant for a small business with no marketing team.

Business: ${b}
Goal: ${g}

Make a ${days}-day marketing plan of 8 to 20 concrete tasks. Each task must be doable in under 2 hours. Start with any setup, spread the rest across the period, and end with a review of results.

Reply ONLY with a markdown table with exactly these columns:
| Day | Task | Details | Channel | Priority |

- Day: a number from 1 to ${days} (Day 1 is the start)
- Task: a short action, max 70 characters
- Details: one or two sentences on exactly what to do
- Channel: for example Facebook, Instagram, TikTok, Email, Website, Google Business Profile, or General
- Priority: Low, Medium, High or Urgent

No text before or after the table.`;
}

const PRIORITIES: Record<string, TaskPriority> = {
  low: "Low", medium: "Medium", med: "Medium", normal: "Medium", high: "High", urgent: "Urgent", critical: "Urgent",
  // Vietnamese, without accents
  thap: "Low", trungbinh: "Medium", cao: "High", khan: "Urgent", khancap: "Urgent",
};

function normalizePriority(value: string | undefined): TaskPriority {
  const key = (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return PRIORITIES[key] ?? "Medium";
}

/** Strip markdown emphasis, links and stray pipes from a cell. */
function cleanCell(value: unknown): string {
  return String(value ?? "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|`)/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDay(value: string): { dayOffset: number | null; date: string | null } | null {
  const v = cleanCell(value);
  const iso = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(`${iso[0]}T00:00:00Z`);
    if (!isNaN(d.getTime())) return { dayOffset: null, date: iso[0] };
  }
  const num = v.match(/\d+/);
  if (num) {
    const n = parseInt(num[0], 10);
    if (n >= 0 && n <= 366) return { dayOffset: Math.max(n - 1, 0), date: null };
  }
  return null;
}

type Columns = { day: number; title: number; description: number; channel: number; priority: number };

const HEADER_ALIASES: Record<keyof Columns, string[]> = {
  day: ["day", "date", "when", "ngay", "ngày"],
  title: ["task", "title", "action", "todo", "to do", "activity", "viec", "việc", "cong viec", "công việc"],
  description: ["details", "detail", "description", "notes", "how", "what", "mo ta", "mô tả", "chi tiet", "chi tiết"],
  channel: ["channel", "platform", "kenh", "kênh"],
  priority: ["priority", "importance", "uu tien", "ưu tiên"],
};

function detectColumns(header: string[]): Columns | null {
  const lower = header.map(h => cleanCell(h).toLowerCase());
  const find = (key: keyof Columns) => lower.findIndex(h => HEADER_ALIASES[key].some(a => h === a || h.startsWith(a)));
  const cols: Columns = {
    day: find("day"), title: find("title"), description: find("description"), channel: find("channel"), priority: find("priority"),
  };
  return cols.title >= 0 ? cols : null;
}

const DEFAULT_COLUMNS: Columns = { day: 0, title: 1, description: 2, channel: 3, priority: 4 };

function rowsToTasks(rows: string[][]): ParseResult {
  if (rows.length === 0) return { tasks: [], skipped: 0 };
  let cols = detectColumns(rows[0]);
  let body = rows;
  if (cols) body = rows.slice(1);
  else cols = DEFAULT_COLUMNS;

  const tasks: ParsedPlanTask[] = [];
  let skipped = 0;
  for (const row of body) {
    if (row.every(c => /^[\s:-]*$/.test(c))) continue; // markdown separator or empty row
    const title = cleanCell(row[cols.title]);
    const when = cols.day >= 0 ? parseDay(row[cols.day] ?? "") : { dayOffset: tasks.length, date: null };
    if (!title || !when) { skipped++; continue; }
    tasks.push({
      title: title.slice(0, 120),
      description: cols.description >= 0 ? cleanCell(row[cols.description]).slice(0, 600) : "",
      channel: cols.channel >= 0 ? cleanCell(row[cols.channel]).slice(0, 40) || "General" : "General",
      priority: normalizePriority(cols.priority >= 0 ? row[cols.priority] : undefined),
      ...when,
    });
    if (tasks.length >= MAX_IMPORTED_TASKS) break;
  }
  return { tasks, skipped };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function tryJson(text: string): ParseResult | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return null;
  try {
    const data = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== "object") return null;
    const keys = Array.from(new Set(data.flatMap((item: Record<string, unknown>) => Object.keys(item ?? {}))));
    const rows = [keys, ...data.map((item: Record<string, unknown>) => keys.map(k => cleanCell(item[k])))];
    return rowsToTasks(rows);
  } catch {
    return null;
  }
}

export function parsePastedPlan(input: string): ParseResult {
  const text = input.replace(/\r\n?/g, "\n").replace(/```[a-z]*\n?/gi, "").trim();
  if (!text) return { tasks: [], skipped: 0 };

  const json = text.startsWith("[") || text.startsWith("{") ? tryJson(text) : null;
  if (json && json.tasks.length) return json;

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Markdown table: lines with pipes.
  const pipeLines = lines.filter(l => (l.match(/\|/g) || []).length >= 2);
  if (pipeLines.length >= 2) {
    const rows = pipeLines.map(l => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim()));
    return rowsToTasks(rows);
  }

  // Tab-separated: copying a rendered table from a chat.
  const tabLines = lines.filter(l => l.includes("\t"));
  if (tabLines.length >= 2) return rowsToTasks(tabLines.map(l => l.split("\t")));

  // CSV with a header row.
  const csvLines = lines.filter(l => l.includes(","));
  if (csvLines.length >= 2 && detectColumns(splitCsvLine(csvLines[0]))) {
    return rowsToTasks(csvLines.map(splitCsvLine));
  }

  // Last resort: numbered or bulleted list, one task per line ("Day 3: Post a reel").
  const listTasks: ParsedPlanTask[] = [];
  for (const line of lines) {
    const m = line.match(/^(?:[-*•]\s*)?(?:day\s*(\d+)\s*[:.)-]\s*|(\d+)[.)]\s+)(.+)$/i);
    if (!m) continue;
    const day = m[1] ? parseInt(m[1], 10) - 1 : null;
    listTasks.push({
      title: cleanCell(m[3]).slice(0, 120),
      description: "",
      channel: "General",
      priority: "Medium",
      dayOffset: day ?? listTasks.length,
      date: null,
    });
    if (listTasks.length >= MAX_IMPORTED_TASKS) break;
  }
  return { tasks: listTasks, skipped: 0 };
}
