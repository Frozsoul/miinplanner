import type { TaskData, TaskPriority, TaskStatus } from "@/types";

/**
 * Ready-made marketing playbooks for small businesses.
 * Each task has a dayOffset so due dates are set relative to the day the user adds the template.
 * Keep advice generic, practical and safe to follow without an expert.
 */

export interface TemplateTask {
  title: string;
  description: string;
  priority: TaskPriority;
  channel: string;
  tags: string[];
  dayOffset: number;
}

export type TemplateCategory = "Local" | "Social" | "Campaign" | "Website" | "Content" | "Email";

export interface MarketingTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  durationDays: number;
  tasks: TemplateTask[];
}

export const TEMPLATE_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Done"];

const t = (
  dayOffset: number,
  title: string,
  description: string,
  channel: string,
  priority: TaskPriority = "Medium",
  tags: string[] = [],
): TemplateTask => ({ dayOffset, title, description, channel, priority, tags });

export const taskSpaceTemplates: MarketingTemplate[] = [
  {
    id: "google-business-profile",
    name: "Google Business Profile setup",
    description: "Get found on Google Maps and local search. Claim, complete and start using your free Business Profile in two weeks.",
    category: "Local",
    durationDays: 14,
    tasks: [
      t(0, "Claim or create your Business Profile", "Search your business on Google Maps. If it exists, claim it; if not, create it at business.google.com. Start verification straight away because it can take a few days.", "Google Business Profile", "Urgent", ["setup"]),
      t(1, "Pick the right primary category", "Choose the most specific category that describes your main service (e.g. 'Bakery', not 'Store'). Add 2-4 secondary categories only if they are genuinely true.", "Google Business Profile", "High", ["setup"]),
      t(1, "Fill in hours, phone, website and service area", "Make sure name, address and phone match your website and other listings exactly. Add holiday hours if relevant.", "Google Business Profile", "High", ["setup"]),
      t(2, "Write your business description", "Up to 750 characters: what you do, who for, where, and what makes you different. Write for customers, not keywords.", "Google Business Profile", "Medium", ["content"]),
      t(3, "Upload 10 real photos", "Storefront or logo, interior, team, and your best products or work. Real photos beat stock photos. Keep adding new ones every month.", "Google Business Profile", "High", ["content"]),
      t(4, "Add your products or services with prices", "List your main products or services with a short description and a price or price range so people can compare before calling.", "Google Business Profile", "Medium", ["content"]),
      t(6, "Publish your first update post", "Share an offer, event or news with a photo and a clear button (Call, Book, Learn more). Aim for one post a week.", "Google Business Profile", "Medium", ["content", "recurring"]),
      t(7, "Add your top 5 FAQs as Q&A", "Answer the questions customers ask most (parking, payment, delivery, booking). Keep answers short and factual.", "Google Business Profile", "Low", ["content"]),
      t(9, "Ask 5 happy customers for a review", "Send your review link personally. Never offer discounts or gifts in return for reviews; Google doesn't allow incentivised reviews.", "Google Business Profile", "High", ["reviews"]),
      t(10, "Reply to every review", "Thank positive reviewers by name. For negative ones, stay calm, apologise, and offer to fix it offline.", "Google Business Profile", "Medium", ["reviews", "recurring"]),
      t(13, "Check your Performance tab", "Look at searches, calls, direction requests and website clicks. Write down this month's numbers so you can compare next month.", "Google Business Profile", "Medium", ["review"]),
    ],
  },
  {
    id: "first-10-reviews",
    name: "Get your first 10 Google reviews",
    description: "A simple 3-week routine to collect honest reviews from real customers and reply to every one.",
    category: "Local",
    durationDays: 21,
    tasks: [
      t(0, "Get your short review link", "In your Business Profile, choose 'Ask for reviews' and copy the link. Save it somewhere you can paste it quickly.", "Google Business Profile", "Urgent", ["setup"]),
      t(1, "List 20 recent happy customers", "Think of customers who were clearly satisfied in the last 3 months. Note how you can reach each one (Zalo, SMS, email).", "General", "High", ["prep"]),
      t(2, "Write a short, personal request message", "Two or three sentences: thank them, say reviews help a small business, include the link. No incentives, and ask everyone, not only the happiest.", "General", "High", ["prep"]),
      t(3, "Send the first 10 requests", "Send personally, one by one. A message with their name gets far more replies than a group blast.", "Zalo", "High", ["outreach"]),
      t(4, "Make a QR code for the review link", "Print it on receipts, a counter card or your packaging so new customers can review on the spot.", "Offline / In-store", "Medium", ["setup"]),
      t(7, "Reply to every new review", "Thank people by name and mention what they bought or liked. Replies show future customers that you care.", "Google Business Profile", "Medium", ["reviews", "recurring"]),
      t(8, "Send the next 10 requests", "Repeat with the rest of your list. Add a friendly reminder to anyone from the first batch who said yes but hasn't posted.", "Zalo", "Medium", ["outreach"]),
      t(12, "Add the ask to your normal routine", "Decide the moment you'll always ask (after delivery, at checkout, after a job is done) and who on the team does it.", "General", "Medium", ["process"]),
      t(20, "Count reviews and pick your next goal", "Compare your review count and average rating with 3 weeks ago. Set a monthly target you can keep up.", "General", "Low", ["review"]),
    ],
  },
  {
    id: "social-first-30-days",
    name: "Social media starter: first 30 days",
    description: "Set up one or two channels properly and build a posting habit you can actually keep, without burning out.",
    category: "Social",
    durationDays: 30,
    tasks: [
      t(0, "Choose 1-2 channels where your customers are", "Don't try to be everywhere. For most local businesses in Vietnam that's Facebook plus Zalo or TikTok. Pick what you can maintain.", "General", "Urgent", ["strategy"]),
      t(1, "Complete your profiles", "Same logo, name and short bio everywhere. Add phone, address, opening hours and a link to book or order.", "Facebook", "High", ["setup"]),
      t(2, "Pick 3 content themes", "For example: behind the scenes, customer results, tips. Themes make it much easier to decide what to post.", "General", "High", ["strategy"]),
      t(3, "Batch-create your first 8 posts", "Take photos and short videos in one session. Write captions for all 8 so the next two weeks are covered.", "General", "High", ["content"]),
      t(4, "Publish post 1 and 2", "Post at the times your customers are most likely online (often lunch and evening). Reply to every comment within a day.", "Facebook", "Medium", ["content", "recurring"]),
      t(7, "Post a short behind-the-scenes video", "15-30 seconds, filmed on your phone. Show how you make, prepare or deliver something. Real beats polished.", "TikTok", "Medium", ["content"]),
      t(10, "Share a customer story or review", "With permission, share a photo or quote from a happy customer and thank them publicly.", "Facebook", "Medium", ["content"]),
      t(14, "Check what worked in week 1-2", "Look at reach, comments and messages per post. Note your best 2 posts and why you think they worked.", "General", "Medium", ["review"]),
      t(15, "Batch-create the next 8 posts", "Do more of what worked. Drop the theme that got no reaction.", "General", "High", ["content"]),
      t(21, "Run one simple engagement post", "Ask a question or run a poll your customers will enjoy answering. Reply to everyone.", "Facebook", "Low", ["content"]),
      t(29, "30-day review and next month's plan", "Compare followers, messages and orders from social with the start of the month. Decide what to keep, stop and try next.", "General", "High", ["review"]),
    ],
  },
  {
    id: "product-launch",
    name: "Product or service launch",
    description: "Launch something new in 3 weeks: build anticipation, launch clearly, then follow up with the people who showed interest.",
    category: "Campaign",
    durationDays: 21,
    tasks: [
      t(0, "Write a one-line pitch and the offer", "Who it's for, what problem it solves, the price, and any launch offer. If you can't say it in one line, simplify.", "General", "Urgent", ["strategy"]),
      t(1, "Set a launch date and one goal", "One measurable goal, e.g. 30 orders or 15 bookings in the first two weeks.", "General", "High", ["strategy"]),
      t(2, "Take photos or a short demo video", "Show the product in use, not just on a white background.", "General", "High", ["content"]),
      t(3, "Create the product page or order form", "Price, what's included, photos, FAQ and one clear button. Test it on your phone.", "Website / Blog", "High", ["setup"]),
      t(5, "Teaser post: something new is coming", "Show a hint without revealing everything. Ask people to comment or message to get notified.", "Facebook", "Medium", ["content"]),
      t(7, "Tell your existing customers first", "Send a personal message or email to past customers with early access or a small launch perk.", "Email", "High", ["outreach"]),
      t(10, "Behind-the-scenes post or video", "Show why and how you made it. People buy stories.", "TikTok", "Medium", ["content"]),
      t(14, "Launch day: announce everywhere", "Post on every channel you use, update your Business Profile, and pin the post. Reply fast to every question.", "General", "Urgent", ["launch"]),
      t(15, "Follow up with everyone who asked", "Message each person who commented or asked for details during the teaser phase.", "Zalo", "High", ["outreach"]),
      t(17, "Share the first customer reactions", "Post a review, photo or quote from an early buyer (with permission).", "Facebook", "Medium", ["content"]),
      t(20, "Launch review", "Compare results with your goal. Note which channel brought the most orders and what you'd change next time.", "General", "High", ["review"]),
    ],
  },
  {
    id: "seasonal-promo",
    name: "Holiday or Tet promotion",
    description: "Plan a seasonal campaign 4 weeks ahead so you are ready before customers start shopping.",
    category: "Campaign",
    durationDays: 28,
    tasks: [
      t(0, "Pick the offer and the dates", "Gift set, bundle, early-bird price or free delivery. Decide when it starts, when it ends, and how much stock you have.", "General", "Urgent", ["strategy"]),
      t(1, "Check last year's numbers", "Which days were busiest and which products sold best? Plan stock and staff around that.", "General", "High", ["prep"]),
      t(3, "Prepare seasonal visuals", "Update your cover photos, profile banners and packaging or in-store signage with the seasonal look.", "General", "Medium", ["content"]),
      t(5, "Set up pre-orders or bookings", "A simple form or message template so customers can reserve early and you can plan capacity.", "Website / Blog", "High", ["setup"]),
      t(7, "Announce the offer to past customers", "Message or email your existing customers first, with a reason to order early.", "Email", "High", ["outreach"]),
      t(8, "Publish the offer post and pin it", "Clear price, dates, how to order and the deadline. Pin it to the top of your page.", "Facebook", "High", ["content"]),
      t(9, "Add the offer to your Business Profile", "Post an Offer update with dates and a button, and add special opening hours if they change.", "Google Business Profile", "Medium", ["content"]),
      t(14, "Mid-campaign reminder", "Remind people of the deadline and share what's popular so far.", "Facebook", "Medium", ["content"]),
      t(20, "Last-chance message", "One final reminder 2-3 days before the deadline to everyone who showed interest.", "Zalo", "High", ["outreach"]),
      t(27, "Wrap-up and thank-you", "Thank customers publicly, then note revenue, best sellers and what to prepare earlier next year.", "General", "Medium", ["review"]),
    ],
  },
  {
    id: "website-seo-basics",
    name: "Website SEO basics",
    description: "The essential checks that help Google (and AI search) understand your site. No technical background needed.",
    category: "Website",
    durationDays: 21,
    tasks: [
      t(0, "Set up Google Search Console", "Add and verify your site at search.google.com/search-console, then submit your sitemap (often yoursite.com/sitemap.xml).", "Website / Blog", "Urgent", ["setup"]),
      t(1, "List the 5 searches you want to be found for", "Think like a customer: service + city (e.g. 'wedding cake Hanoi'). Check Search Console for what people already find you with.", "Website / Blog", "High", ["research"]),
      t(3, "Give each key page one clear focus", "Match each of those searches to one page. Avoid two pages competing for the same thing.", "Website / Blog", "High", ["on-page"]),
      t(5, "Rewrite page titles and meta descriptions", "Title under about 60 characters with the main phrase and your brand. Description that makes someone want to click.", "Website / Blog", "High", ["on-page"]),
      t(7, "Check your site on a phone", "Open every key page on your phone. Fix anything hard to read, slow, or hard to tap.", "Website / Blog", "High", ["technical"]),
      t(9, "Compress large images", "Resize photos to the size they are shown and compress them. Big images are the most common cause of slow pages.", "Website / Blog", "Medium", ["technical"]),
      t(11, "Add your business details to every page footer", "Name, address, phone and opening hours, matching your Google Business Profile exactly.", "Website / Blog", "Medium", ["local"]),
      t(13, "Link your key pages to each other", "Add helpful links between related pages and from your homepage to your most important services.", "Website / Blog", "Medium", ["on-page"]),
      t(16, "Add an FAQ section to your main service page", "Answer 4-5 real customer questions in plain language. This helps both Google and AI answers.", "Website / Blog", "Medium", ["content"]),
      t(20, "Check Search Console for errors and progress", "Look at the Pages report for indexing problems and note clicks and impressions to compare next month.", "Website / Blog", "Medium", ["review"]),
    ],
  },
  {
    id: "monthly-content-plan",
    name: "Monthly content plan",
    description: "A repeatable monthly rhythm: plan once, create in batches, publish steadily, and learn from the results.",
    category: "Content",
    durationDays: 30,
    tasks: [
      t(0, "Review last month's best content", "Find the 3 posts or articles that brought the most engagement, messages or sales.", "General", "High", ["review"]),
      t(1, "Collect 10 customer questions", "From messages, comments, calls and reviews. Each one is a content idea.", "General", "High", ["research"]),
      t(2, "Plan the month's topics", "Pick 8-12 topics mixing tips, behind the scenes, customer stories and offers. Put a date on each.", "General", "High", ["planning"]),
      t(4, "Batch-create week 1-2 content", "Write captions and take photos or videos for the first two weeks in one or two sessions.", "General", "High", ["content"]),
      t(5, "Write one longer article or guide", "Answer your most common customer question in depth on your website, then share it on social.", "Website / Blog", "Medium", ["content"]),
      t(7, "Schedule week 1-2 posts", "Use each platform's built-in scheduler or a free tool so posting doesn't depend on remembering.", "General", "Medium", ["publishing"]),
      t(15, "Batch-create week 3-4 content", "Adjust based on what performed well in the first two weeks.", "General", "High", ["content"]),
      t(16, "Schedule week 3-4 posts", "Leave space for one timely post in case something happens you want to react to.", "General", "Medium", ["publishing"]),
      t(29, "Monthly results check", "Write down reach, messages and sales from content. Keep what worked for next month's plan.", "General", "High", ["review"]),
    ],
  },
  {
    id: "email-newsletter-setup",
    name: "Email newsletter setup",
    description: "Start collecting emails and send a simple monthly newsletter that brings customers back.",
    category: "Email",
    durationDays: 21,
    tasks: [
      t(0, "Choose a free email tool", "Most tools have a free plan for small lists. Pick one that has a signup form and simple templates.", "Email", "High", ["setup"]),
      t(1, "Get explicit consent for every contact", "Only add people who agreed to receive emails. Don't import contacts without permission; it's bad practice and can break data protection rules.", "Email", "Urgent", ["compliance"]),
      t(2, "Add a signup form to your website", "Place it in the footer and on your most visited page. Say what people will get and how often.", "Website / Blog", "High", ["setup"]),
      t(3, "Create a simple reason to sign up", "A small checklist, a first-order perk or early access to offers.", "Email", "Medium", ["strategy"]),
      t(5, "Write your welcome email", "Thank them, say what to expect, and give one useful tip or offer. Set it to send automatically.", "Email", "High", ["content"]),
      t(7, "Share the signup link on social and in-store", "Pin it, add it to your bio and put a QR code at the counter.", "Facebook", "Medium", ["promotion"]),
      t(12, "Write your first newsletter", "One main story, one tip, one offer. Short, with a clear button. Send a test to yourself first.", "Email", "High", ["content"]),
      t(14, "Send the first newsletter", "Send at a time your customers read email. Check that the unsubscribe link works.", "Email", "High", ["publishing"]),
      t(20, "Check opens, clicks and replies", "Note the numbers and which link got clicked most. Plan next month's topic around it.", "Email", "Medium", ["review"]),
    ],
  },
];

/** Turns a template into board tasks with real due dates starting from `start`. */
export function templateToTasks(template: MarketingTemplate, start: Date, status: TaskStatus): TaskData[] {
  return template.tasks.map((task, i) => {
    const due = new Date(start);
    due.setDate(due.getDate() + task.dayOffset);
    due.setHours(9, 0, 0, 0);
    return {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status,
      channel: task.channel,
      tags: Array.from(new Set([`template:${template.id}`, ...task.tags])),
      startDate: due.toISOString(),
      dueDate: due.toISOString(),
      archived: false,
      order: Date.now() + i,
    };
  });
}
