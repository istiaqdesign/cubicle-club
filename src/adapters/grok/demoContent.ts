import type { RoleId } from '../../core/types';

// A pretend Grok Bot team. Everything here is something a real bot could
// report about itself: its name, role, the routine that fired, the tool it is
// using, and what it needs from the boss.

export const DEMO_BOTS: { name: string; role: RoleId; lifetimeDone: number }[] = [
  { name: 'Pip', role: 'researcher', lifetimeDone: 22 },
  { name: 'Juno', role: 'writer', lifetimeDone: 9 },
  { name: 'Mochi', role: 'designer', lifetimeDone: 22 },
  { name: 'Byte', role: 'coder', lifetimeDone: 96 },
  { name: 'Nova', role: 'manager', lifetimeDone: 47 },
];

/** Names for new hires on onboarding day. */
export const NEW_HIRES = ['Ziggy', 'Tofu', 'Kiwi', 'Echo', 'Pixel', 'Rook', 'Sunny', 'Bean'];

export const ROUTINES: Record<RoleId, string> = {
  manager: 'Daily stand-up',
  researcher: 'Morning research sweep',
  writer: 'Content pipeline',
  coder: 'Bug bash',
  designer: 'Creative sprint',
};

export interface TaskTemplate {
  role: RoleId;
  title: string;
  tool: string;
  handoff?: RoleId;
  approval?: string;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  { role: 'researcher', title: 'Compare 6 CRM tools', tool: 'Browser', handoff: 'writer' },
  { role: 'researcher', title: 'Summarize 40 app reviews', tool: 'Browser', handoff: 'writer' },
  { role: 'researcher', title: 'Find 20 podcast guests', tool: 'Spreadsheet', approval: 'Email 20 podcast hosts with our pitch?' },
  { role: 'researcher', title: 'Check competitor pricing', tool: 'Browser', handoff: 'manager' },
  { role: 'researcher', title: 'Dig up 2025 market stats', tool: 'Browser' },
  { role: 'writer', title: 'Draft launch newsletter', tool: 'Docs', approval: 'Send the newsletter to 2,431 subscribers?' },
  { role: 'writer', title: 'Write 5 social post hooks', tool: 'Docs', handoff: 'designer' },
  { role: 'writer', title: 'Rewrite pricing page copy', tool: 'Docs', handoff: 'coder' },
  { role: 'writer', title: 'Reply to 12 support emails', tool: 'Email', approval: 'Send 12 replies to customers?' },
  { role: 'coder', title: 'Fix checkout bug', tool: 'Code repo', approval: 'Deploy the checkout fix to production?' },
  { role: 'coder', title: 'Ship new landing page', tool: 'Terminal', approval: 'Publish the new landing page?' },
  { role: 'coder', title: 'Add dark mode', tool: 'Code repo' },
  { role: 'coder', title: 'Speed up image loading', tool: 'Terminal' },
  { role: 'designer', title: 'Make 6 ad variations', tool: 'Design files', handoff: 'writer' },
  { role: 'designer', title: 'Refresh onboarding screens', tool: 'Design files', handoff: 'coder' },
  { role: 'designer', title: 'Design launch banner', tool: 'Design files', approval: 'Post the launch banner everywhere?' },
  { role: 'manager', title: "Plan this week's sprint", tool: 'Calendar' },
  { role: 'manager', title: 'Triage 38 unread emails', tool: 'Email' },
  { role: 'manager', title: 'Prep investor update', tool: 'Docs', approval: 'Send the investor update to 9 people?' },
];

export const templatesFor = (role: RoleId) => TASK_TEMPLATES.filter((t) => t.role === role);

/** What a bot might ask after finishing work someone handed to it. */
export const FOLLOW_UP_ASKS: Record<RoleId, string> = {
  manager: 'Move the launch to Thursday?',
  researcher: 'Share the research doc with the whole team?',
  writer: 'Publish this post on the blog?',
  coder: 'Merge and deploy to production?',
  designer: 'Send the final designs to the client?',
};

export const ERRORS: ((tool: string) => string)[] = [
  (tool) => `${tool} timed out`,
  (tool) => `Login expired on ${tool}`,
  (tool) => `${tool} returned a 500 error`,
  () => 'Rate limited. Again.',
  () => 'Lost track of the browser tab',
  () => 'A formula exploded in the spreadsheet',
];
