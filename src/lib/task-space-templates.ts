
import type { TaskSpace, TaskData, TaskStatus } from "@/types";
import { DEFAULT_TASK_STATUSES } from "@/lib/constants";

interface TaskSpaceTemplate extends Omit<TaskSpace, 'id' | 'createdAt'> {
  description: string;
}

export const taskSpaceTemplates: TaskSpaceTemplate[] = [
  {
    name: "Default Workspace",
    description: "A clean slate with the standard workflow. Load this to reset your board to the default settings.",
    taskStatuses: DEFAULT_TASK_STATUSES,
    tasks: [
      { title: "Welcome! This is your first task.", status: "To Do", priority: "Medium", order: 0, description: "You can edit this task, drag it to another status, or delete it." },
    ],
  },
  {
    name: "Learn a New Skill",
    description: "A structured plan to help you learn a new skill, from initial research to building your first project.",
    taskStatuses: ['Backlog', 'Learning', 'Practicing', 'Project', 'Completed'],
    tasks: [
      { title: "Research: Identify top 5 learning resources (courses, books)", status: "Backlog", priority: "High", order: 0 },
      { title: "Setup: Install necessary software and tools", status: "Backlog", priority: "High", order: 1 },
      { title: "Module 1: Complete the basics", status: "Backlog", priority: "Medium", order: 2 },
      { title: "Practice: Code-along with tutorials", status: "Backlog", priority: "Medium", order: 3 },
      { title: "Project 1: Build a simple 'Hello World' style application", status: "Backlog", priority: "High", order: 4 },
      { title: "Module 2: Advanced concepts", status: "Backlog", priority: "Medium", order: 5 },
      { title: "Project 2: Build a multi-feature application", status: "Backlog", priority: "High", order: 6 },
      { title: "Review and Refactor Project 2", status: "Backlog", priority: "Low", order: 7 },
    ],
  },
  {
    name: "30-Day Savings Challenge",
    description: "A 30-day plan to help you kickstart your savings habits and cut unnecessary expenses.",
    taskStatuses: ['To Plan', 'In Progress', 'Done', 'Recurring'],
    tasks: [
      { title: "Day 1: Create a detailed monthly budget", status: "To Plan", priority: "Urgent", order: 0 },
      { title: "Day 2: Review and cancel unused subscriptions", status: "To Plan", priority: "High", order: 1 },
      { title: "Day 3: Set up an automatic weekly transfer to savings", status: "To Plan", priority: "High", order: 2 },
      { title: "Weekly: Cook all meals at home (no eating out)", status: "To Plan", priority: "Medium", tags: ["weekly"], order: 3 },
      { title: "Weekly: Review spending against budget", status: "To Plan", priority: "Medium", tags: ["weekly"], order: 4 },
      { title: "Day 15: Mid-month budget check-in", status: "To Plan", priority: "Medium", order: 5 },
      { title: "Day 30: Final review and plan for next month", status: "To Plan", priority: "High", order: 6 },
      { title: "No-spend challenge (5 consecutive days)", status: "To Plan", priority: "Low", order: 7 },
    ],
  },
  {
    name: "Write a Book",
    description: "A complete workflow for authors, from the initial idea to the final edited manuscript.",
    taskStatuses: ['Idea', 'Outline', 'First Draft', 'Editing', 'Final Review'],
    tasks: [
      { title: "Develop core concept and premise", status: "Idea", priority: "High", order: 0 },
      { title: "Create main character profiles", status: "Idea", priority: "Medium", order: 1 },
      { title: "Write a 3-act story structure outline", status: "Outline", priority: "High", order: 2 },
      { title: "Detailed chapter-by-chapter outline", status: "Outline", priority: "Medium", order: 3 },
      { title: "Write Chapter 1", status: "First Draft", priority: "High", order: 4 },
      { title: "Complete First Draft (Act 1)", status: "First Draft", priority: "Medium", order: 5 },
      { title: "Complete First Draft (Act 2)", status: "First Draft", priority: "Medium", order: 6 },
      { title: "Complete First Draft (Act 3)", status: "First Draft", priority: "Medium", order: 7 },
      { title: "Self-edit for plot and character consistency", status: "Editing", priority: "High", order: 8 },
      { title: "Send manuscript to beta readers", status: "Editing", priority: "Medium", order: 9 },
      { title: "Incorporate beta reader feedback", status: "Editing", priority: "High", order: 10 },
      { title: "Line-by-line proofread", status: "Final Review", priority: "High", order: 11 },
    ],
  },
  {
    name: "Product Launch Plan",
    description: "A comprehensive checklist to guide your next product launch, from market research to post-launch analysis.",
    taskStatuses: ['Strategy & Research', 'Development & Messaging', 'Pre-Launch Buzz', 'Launch', 'Post-Launch'],
    tasks: [
      { title: "Market research & competitor analysis", status: "Strategy & Research", priority: "High", order: 0 },
      { title: "Define target audience & user personas", status: "Strategy & Research", priority: "High", order: 1 },
      { title: "Finalize product features & pricing", status: "Development & Messaging", priority: "Urgent", order: 2 },
      { title: "Develop key messaging & value proposition", status: "Development & Messaging", priority: "High", order: 3 },
      { title: "Create landing page and marketing materials", status: "Development & Messaging", priority: "Medium", order: 4 },
      { title: "Plan social media announcement campaign", status: "Pre-Launch Buzz", priority: "High", order: 5 },
      { title: "Coordinate with PR & influencers", status: "Pre-Launch Buzz", priority: "Medium", order: 6 },
      { title: "LAUNCH DAY: Execute marketing plan", status: "Launch", priority: "Urgent", order: 7 },
      { title: "Monitor launch metrics & gather feedback", status: "Post-Launch", priority: "High", order: 8 },
      { title: "Send post-launch follow-up emails", status: "Post-Launch", priority: "Medium", order: 9 },
    ],
  },
  {
    name: "SEO Audit Checklist",
    description: "A step-by-step guide for performing a basic but effective SEO audit on your website.",
    taskStatuses: ['Technical SEO', 'On-Page SEO', 'Content Audit', 'Reporting'],
    tasks: [
      { title: "Check for indexing issues (Google Search Console)", status: "Technical SEO", priority: "Urgent", order: 0 },
      { title: "Run a site speed test (PageSpeed Insights)", status: "Technical SEO", priority: "High", order: 1 },
      { title: "Ensure website is mobile-friendly", status: "Technical SEO", priority: "High", order: 2 },
      { title: "Review and optimize page titles and meta descriptions", status: "On-Page SEO", priority: "High", order: 3 },
      { title: "Check for proper use of header tags (H1, H2)", status: "On-Page SEO", priority: "Medium", order: 4 },
      { title: "Audit for broken links (internal and external)", status: "On-Page SEO", priority: "Medium", order: 5 },
      { title: "Identify and remove thin or duplicate content", status: "Content Audit", priority: "High", order: 6 },
      { title: "Find content to update and republish", status: "Content Audit", priority: "Medium", order: 7 },
      { title: "Compile findings and create an action plan", status: "Reporting", priority: "High", order: 8 },
    ],
  },
  {
    name: "Content Marketing Strategy",
    description: "Plan and execute a content marketing strategy for a quarter, from brainstorming to performance analysis.",
    taskStatuses: ['Strategy', 'Content Creation', 'Distribution', 'Analysis'],
    tasks: [
      { title: "Define quarterly content goals and KPIs", status: "Strategy", priority: "High", order: 0 },
      { title: "Brainstorm blog post and video ideas", status: "Strategy", priority: "Medium", order: 1 },
      { title: "Create a content calendar for the quarter", status: "Strategy", priority: "High", order: 2 },
      { title: "Write and edit 4 blog posts", status: "Content Creation", priority: "High", order: 3 },
      { title: "Record and produce 2 video tutorials", status: "Content Creation", priority: "Medium", order: 4 },
      { title: "Design social media graphics for all content", status: "Content Creation", priority: "Medium", order: 5 },
      { title: "Schedule social media promotion for all content pieces", status: "Distribution", priority: "High", order: 6 },
      { title: "Send email newsletter featuring new content", status: "Distribution", priority: "Medium", order: 7 },
      { title: "Review content performance at end of quarter", status: "Analysis", priority: "High", order: 8 },
    ],
  },
];

    