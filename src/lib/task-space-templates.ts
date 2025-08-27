
import type { TaskSpace, TaskData, TaskStatus } from "@/types";
import { DEFAULT_TASK_STATUSES } from "@/lib/constants";

interface TaskSpaceTemplate extends Omit<TaskSpace, 'id' | 'createdAt'> {
  description: string;
}

export const taskSpaceTemplates: TaskSpaceTemplate[] = [
  {
    "name": "Default Workspace",
    "description": "A flexible starting point for any project. Reset your board to a clean slate with standard task statuses to organize your work efficiently.",
    "taskStatuses": ["To Do", "In Progress", "Done"],
    "tasks": [
      {
        "title": "Get Started: Explore Your First Task",
        "status": "To Do",
        "priority": "Medium",
        "order": 0,
        "description": "Try editing, moving, or deleting this task to familiarize yourself with the board. Add new tasks to kick off your project!",
        "tags": ["welcome", "tutorial"]
      }
    ]
  },
  {
    "name": "30-Day Savings Challenge",
    "description": "A structured 30-day plan to build better financial habits, save money, and reduce unnecessary expenses with clear milestones.",
    "taskStatuses": ["To Plan", "In Progress", "Done", "Recurring"],
    "tasks": [
      {
        "title": "Day 1: Build Your Monthly Budget",
        "status": "To Plan",
        "priority": "Urgent",
        "order": 0,
        "description": "List all income and expenses. Use a budgeting app or spreadsheet for clarity.",
        "tags": ["budget", "finance"]
      },
      {
        "title": "Day 2: Cancel Unused Subscriptions",
        "status": "To Plan",
        "priority": "High",
        "order": 1,
        "description": "Check bank statements and cancel subscriptions you no longer use (e.g., streaming, gym).",
        "tags": ["savings"]
      },
      {
        "title": "Day 3: Automate Savings Transfer",
        "status": "To Plan",
        "priority": "High",
        "order": 2,
        "description": "Set up a weekly transfer of $25-$50 to a savings account.",
        "tags": ["savings", "automation"]
      },
      {
        "title": "Weekly: Cook All Meals at Home",
        "status": "Recurring",
        "priority": "Medium",
        "order": 3,
        "description": "Avoid eating out to save money. Plan meals in advance.",
        "tags": ["weekly", "savings"]
      },
      {
        "title": "Weekly: Track Spending vs. Budget",
        "status": "Recurring",
        "priority": "Medium",
        "order": 4,
        "description": "Compare weekly spending to your budget and adjust as needed.",
        "tags": ["weekly", "budget"]
      },
      {
        "title": "Day 15: Mid-Month Budget Review",
        "status": "To Plan",
        "priority": "Medium",
        "order": 5,
        "description": "Assess savings progress and tweak budget if overspending.",
        "tags": ["checkpoint", "finance"]
      },
      {
        "title": "Day 30: Final Budget Review",
        "status": "To Plan",
        "priority": "High",
        "order": 6,
        "description": "Evaluate total savings and plan for the next month.",
        "tags": ["milestone", "finance"]
      },
      {
        "title": "No-Spend Challenge (5 Days)",
        "status": "To Plan",
        "priority": "Low",
        "order": 7,
        "description": "Pick 5 consecutive days to spend only on essentials (e.g., rent, utilities).",
        "tags": ["challenge", "savings"]
      }
    ]
  },
  {
    "name": "Write a Book",
    "description": "A streamlined workflow for authors to plan, write, and polish a manuscript from initial idea to final draft.",
    "taskStatuses": ["Ideation", "Outlining", "Drafting", "Editing", "Finalized"],
    "tasks": [
      {
        "title": "Define Core Book Concept",
        "status": "Ideation",
        "priority": "High",
        "order": 0,
        "description": "Write a 1-2 sentence premise summarizing your book’s theme and genre.",
        "tags": ["planning", "creative"]
      },
      {
        "title": "Develop Character Profiles",
        "status": "Ideation",
        "priority": "Medium",
        "order": 1,
        "description": "Create profiles for main characters (e.g., backstory, motivations).",
        "tags": ["characters", "planning"]
      },
      {
        "title": "Write 3-Act Story Outline",
        "status": "Outlining",
        "priority": "High",
        "order": 2,
        "description": "Map out the major plot points in a 3-act structure.",
        "tags": ["structure", "planning"]
      },
      {
        "title": "Create Chapter-by-Chapter Outline",
        "status": "Outlining",
        "priority": "Medium",
        "order": 3,
        "description": "Break down the story into chapters with key scenes.",
        "tags": ["structure", "planning"]
      },
      {
        "title": "Write Chapter 1",
        "status": "Drafting",
        "priority": "High",
        "order": 4,
        "description": "Start drafting the first chapter to set the tone.",
        "tags": ["writing", "milestone"]
      },
      {
        "title": "Complete Act 1 Draft",
        "status": "Drafting",
        "priority": "Medium",
        "order": 5,
        "description": "Finish the first act of your manuscript.",
        "tags": ["writing", "milestone"]
      },
      {
        "title": "Complete Act 2 Draft",
        "status": "Drafting",
        "priority": "Medium",
        "order": 6,
        "description": "Complete the second act, focusing on character development.",
        "tags": ["writing"]
      },
      {
        "title": "Complete Act 3 Draft",
        "status": "Drafting",
        "priority": "Medium",
        "order": 7,
        "description": "Wrap up the first draft with a strong conclusion.",
        "tags": ["writing", "milestone"]
      },
      {
        "title": "Self-Edit for Plot Consistency",
        "status": "Editing",
        "priority": "High",
        "order": 8,
        "description": "Review the draft for plot holes and character consistency.",
        "tags": ["editing"]
      },
      {
        "title": "Share with Beta Readers",
        "status": "Editing",
        "priority": "Medium",
        "order": 9,
        "description": "Send the draft to 3-5 beta readers for feedback.",
        "tags": ["feedback", "editing"]
      },
      {
        "title": "Revise Based on Feedback",
        "status": "Editing",
        "priority": "High",
        "order": 10,
        "description": "Incorporate beta reader suggestions to improve the manuscript.",
        "tags": ["editing", "revision"]
      },
      {
        "title": "Final Proofread",
        "status": "Finalized",
        "priority": "High",
        "order": 11,
        "description": "Perform a line-by-line proofread for grammar and style.",
        "tags": ["editing", "final"]
      }
    ]
  },
  {
    "name": "Weekly Fitness Planner",
    "description": "A clear and motivating template to plan and track your weekly fitness and nutrition goals for a healthier lifestyle.",
    "taskStatuses": ["Goals", "Scheduled", "Completed"],
    "tasks": [
      {
        "title": "Set Weekly Fitness Goals",
        "status": "Goals",
        "priority": "High",
        "order": 0,
        "description": "Define 3 specific goals (e.g., run 5k, lift 10% heavier, eat 5 veggie servings daily).",
        "tags": ["fitness", "planning"]
      },
      {
        "title": "Schedule Workouts (Mon, Wed, Fri)",
        "status": "Scheduled",
        "priority": "High",
        "order": 1,
        "description": "Plan 45-minute workouts for Monday, Wednesday, and Friday.",
        "tags": ["workout", "schedule"]
      },
      {
        "title": "Plan Healthy Lunches",
        "status": "Scheduled",
        "priority": "Medium",
        "order": 2,
        "description": "Create a meal plan for 5 healthy lunches and shop for ingredients.",
        "tags": ["nutrition", "planning"]
      },
      {
        "title": "Walk 30 Minutes (Tue, Thu)",
        "status": "Scheduled",
        "priority": "Medium",
        "order": 3,
        "description": "Go for a 30-minute walk on Tuesday and Thursday.",
        "tags": ["workout", "cardio"]
      },
      {
        "title": "Drink 8 Glasses of Water Daily",
        "status": "Scheduled",
        "priority": "Low",
        "order": 4,
        "description": "Track water intake to stay hydrated.",
        "tags": ["nutrition", "daily"]
      },
      {
        "title": "Review Weekly Progress",
        "status": "Goals",
        "priority": "Medium",
        "order": 5,
        "description": "Assess goal completion and plan next week’s fitness goals.",
        "tags": ["review", "fitness"]
      }
    ]
  },
  {
    "name": "SEO Audit Checklist",
    "description": "A concise checklist to perform a thorough SEO audit, optimizing your website for better search engine rankings.",
    "taskStatuses": ["Technical", "On-Page", "Content", "Reporting"],
    "tasks": [
      {
        "title": "Verify Site Indexing",
        "status": "Technical",
        "priority": "Urgent",
        "order": 0,
        "description": "Use Google Search Console to check for indexing errors.",
        "tags": ["seo", "technical"]
      },
      {
        "title": "Test Site Speed",
        "status": "Technical",
        "priority": "High",
        "order": 1,
        "description": "Run PageSpeed Insights and address critical issues.",
        "tags": ["seo", "technical"]
      },
      {
        "title": "Check Mobile-Friendliness",
        "status": "Technical",
        "priority": "High",
        "order": 2,
        "description": "Use Google’s Mobile-Friendly Test to ensure responsiveness.",
        "tags": ["seo", "technical"]
      },
      {
        "title": "Optimize Titles and Meta Descriptions",
        "status": "On-Page",
        "priority": "High",
        "order": 3,
        "description": "Ensure unique, keyword-rich titles and meta descriptions for all pages.",
        "tags": ["seo", "on-page"]
      },
      {
        "title": "Review Header Tag Usage",
        "status": "On-Page",
        "priority": "Medium",
        "order": 4,
        "description": "Verify proper use of H1, H2 tags for content structure.",
        "tags": ["seo", "on-page"]
      },
      {
        "title": "Fix Broken Links",
        "status": "On-Page",
        "priority": "Medium",
        "order": 5,
        "description": "Use a tool like Screaming Frog to identify and fix broken links.",
        "tags": ["seo", "on-page"]
      },
      {
        "title": "Remove Thin/Duplicate Content",
        "status": "Content",
        "priority": "High",
        "order": 6,
        "description": "Identify and eliminate low-value or duplicate content.",
        "tags": ["seo", "content"]
      },
      {
        "title": "Update Outdated Content",
        "status": "Content",
        "priority": "Medium",
        "order": 7,
        "description": "Find high-potential pages to refresh and republish.",
        "tags": ["seo", "content"]
      },
      {
        "title": "Create SEO Action Plan",
        "status": "Reporting",
        "priority": "High",
        "order": 8,
        "description": "Summarize findings and prioritize fixes in a detailed report.",
        "tags": ["seo", "reporting"]
      }
    ]
  },
  {
    "name": "Content Marketing Strategy",
    "description": "A 90-day roadmap to plan, create, distribute, and analyze a high-impact content marketing strategy.",
    "taskStatuses": ["Planning", "Creation", "Promotion", "Analysis"],
    "tasks": [
      {
        "title": "Set Quarterly Content Goals",
        "status": "Planning",
        "priority": "High",
        "order": 0,
        "description": "Define measurable goals (e.g., 20% traffic increase) and KPIs.",
        "tags": ["strategy", "content"]
      },
      {
        "title": "Brainstorm Content Ideas",
        "status": "Planning",
        "priority": "Medium",
        "order": 1,
        "description": "Generate 10+ blog post and video ideas aligned with goals.",
        "tags": ["strategy", "content"]
      },
      {
        "title": "Build Content Calendar",
        "status": "Planning",
        "priority": "High",
        "order": 2,
        "description": "Plan content releases for the next 90 days.",
        "tags": ["strategy", "planning"]
      },
      {
        "title": "Write 4 Blog Posts",
        "status": "Creation",
        "priority": "High",
        "order": 3,
        "description": "Draft and edit 4 high-quality blog posts.",
        "tags": ["content", "writing"]
      },
      {
        "title": "Produce 2 Video Tutorials",
        "status": "Creation",
        "priority": "Medium",
        "order": 4,
        "description": "Record and edit 2 engaging video tutorials.",
        "tags": ["content", "video"]
      },
      {
        "title": "Design Social Media Graphics",
        "status": "Creation",
        "priority": "Medium",
        "order": 5,
        "description": "Create visuals for all content pieces using Canva or similar.",
        "tags": ["content", "design"]
      },
      {
        "title": "Schedule Social Media Posts",
        "status": "Promotion",
        "priority": "High",
        "order": 6,
        "description": "Plan and schedule posts across platforms (e.g., Twitter, LinkedIn).",
        "tags": ["promotion", "social"]
      },
      {
        "title": "Send Email Newsletter",
        "status": "Promotion",
        "priority": "Medium",
        "order": 7,
        "description": "Feature new content in a monthly newsletter.",
        "tags": ["promotion", "email"]
      },
      {
        "title": "Analyze Content Performance",
        "status": "Analysis",
        "priority": "High",
        "order": 8,
        "description": "Review KPIs (traffic, engagement) and adjust strategy.",
        "tags": ["analysis", "content"]
      }
    ]
  },
];

    
