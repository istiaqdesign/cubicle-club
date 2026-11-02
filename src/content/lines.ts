// Speech-bubble templates, filled with real data from the event stream.
// Placeholders: {task} {tool} {to} {from} {count} {n} {nth} {minutes} {title}

export type LineCategory =
  | 'started'
  | 'progress'
  | 'tired'
  | 'handoff_send'
  | 'assign'
  | 'handoff_receive'
  | 'left_on_desk'
  | 'approval_ask'
  | 'approval_wait'
  | 'approved'
  | 'rejected'
  | 'error'
  | 'recovered'
  | 'done'
  | 'streak'
  | 'level_up'
  | 'idle'
  | 'night'
  | 'gossip_open'
  | 'gossip_reply'
  | 'gossip_close'
  | 'cheer'
  | 'speech'
  | 'plane_hit'
  | 'onboard_new'
  | 'onboard_welcome'
  | 'retire_speech'
  | 'retire_farewell'
  | 'rival_start'
  | 'rival_reply'
  | 'rival_taunt'
  | 'rival_win'
  | 'rival_lose'
  | 'review_great'
  | 'review_ok'
  | 'review_bad'
  | 'pet';

export const LINES: Record<LineCategory, string[]> = {
  started: [
    'New task: {task}. Cracking knuckles.',
    "Opening {tool}. Let's do this.",
    '{task}? Say less.',
    'Coffee: loaded. Task: loaded. Go.',
    'Starting {task}. Wish me luck.',
    'Fresh task smell. Love it.',
    "Alright {tool}, it's you and me.",
  ],
  progress: [
    'Tab number {n}. This is fine.',
    'Found something. Might be big. Might be nothing.',
    'Rewrote the intro for the {nth} time. Send snacks.',
    "Step {n} of… let's not count.",
    'Clicked one link. Then {n} more.',
    'Making progress. Slowly. Majestically.',
    "Talking to {tool} again. It's a good listener.",
    'Copy. Paste. Question life. Repeat.',
    'Ooh, a rabbit hole. Just a quick peek.',
    '{n} tries in. Getting warmer.',
  ],
  tired: [
    '{minutes} minutes on this. My pixels hurt.',
    'Is it still today?',
    "I've seen things. Mostly spreadsheets.",
    'Running on fumes and autocomplete.',
    'Brain at {n}% battery.',
    "This task has layers. Like an onion. I'm crying.",
  ],
  handoff_send: [
    "{to}, this one's all yours.",
    'Special delivery for {to}!',
    "Passing the baton. Don't drop it, {to}.",
    'Hot folder, coming through!',
    '{to}, I believe in you. Mostly.',
    'Express mail for {to}. Sign here.',
  ],
  assign: [
    '{to}, got a fun one for you.',
    "New priority, {to}. Everything's a priority.",
    '{to}! Tiny task. Huge impact. Probably.',
    'Delegating with love. Here, {to}.',
  ],
  handoff_receive: [
    'Oh. Oh no. Okay. Got it.',
    'Thanks {from}! …I think?',
    "A folder! For me? You shouldn't have.",
    'Adding it to the pile. The pile grows.',
    'Got it, {from}. Leave it with me.',
    'Is this urgent-urgent or just urgent?',
  ],
  left_on_desk: ['Left it on your desk, {to}!', "{to}'s out. Folder goes on the chair."],
  approval_ask: [
    'Boss, need a quick yes on this one.',
    'Can I hit send? Pretty please?',
    'Big decision. Your call, boss.',
    "I need a grown-up. That's you.",
    "One stamp and I'm out of your hair.",
  ],
  approval_wait: [
    'I’ll just… stand here.',
    'Still here. Still holding the paper.',
    "No rush. I'm just aging gracefully.",
    '*polite cough*',
    'Boss? Boss. Boooss.',
    'The paper is getting warm.',
  ],
  approved: ['YES! Stamped and unstoppable.', 'Approved! Telling everyone.', 'The stamp has spoken!', 'Best. Boss. Ever.'],
  rejected: [
    'Fair. Back to the drawing board.',
    "Rejected. I'll pretend that didn't sting.",
    'Noted. Crying in the break room later.',
    'Okay. Version two incoming.',
  ],
  error: [
    'Uh-oh. {tool} said no.',
    'That was NOT supposed to happen.',
    "There's a bug. Like, an actual bug. On my desk.",
    'Error {n}. My favorite error.',
    "Everything's fine. Nothing is fine.",
    'Who unplugged {tool}?',
  ],
  recovered: [
    'Fixed it! Nobody saw that, right?',
    'Bug squashed. Respectfully.',
    'Back from the dead. Comeback era.',
    'Turned it off and on again. Genius.',
  ],
  done: [
    'Done! {task}, out the door.',
    "That's {count} today. Somebody stop me.",
    'Shipped it. Ding ding!',
    'Finished. Taking a 4-second break.',
    'Another one bites the inbox.',
    'Task {count}: done. Legendary behavior.',
    'Nailed it. Mostly nailed it.',
  ],
  streak: ["{n} in a row. I'm kind of a big deal.", "Can't stop, won't stop.", "Somebody check on me, I'm on fire."],
  level_up: ['Promoted to {title}! Updating my profile.', "{title}?! I'd like to thank my GPU.", '{title} now. Please knock first.'],
  idle: [
    'Coffee number {n}. For focus.',
    'Quick stretch. Very productive stretch.',
    'Inbox zero. Suspicious.',
    'Just thinking. Visibly.',
    'Spinning in my chair. For science.',
    'Five-minute nap. Ten, tops.',
    'Waiting for the next big thing.',
  ],
  night: ['Who turned off the sun?', 'Night shift crew, assemble.', 'Midnight snack break? Midnight snack break.'],
  gossip_open: [
    'Did you see {name} broke {tool} today?',
    '{name} did {count} tasks already. Show-off.',
    'Between us… {name} naps more than they work.',
    'I heard the boss sent {name} back. Twice.',
    "{name}'s been on the same task for ages.",
    'Rumor is {name} is up for promotion.',
    'Is it just me, or does {name} talk to the plants?',
    '{name} reorganized their desk. Again.',
    "{name} says they're \"basically done\". Sure.",
  ],
  gossip_reply: [
    'No way.',
    'Classic {name}.',
    "Don't tell anyone I said this, but… same.",
    "I'm not surprised. At all.",
    'Wait, really?',
    'Spill. Now.',
    'That explains the sighing.',
    'I KNEW it.',
  ],
  gossip_close: ['Shh! Back to work.', 'Okay, okay. Back to it.', 'This conversation never happened.', 'Same time tomorrow?'],
  cheer: ['Speech! Speech!', 'Woo! {name}!', 'Well deserved!', 'Rigged. Congrats though.', "Next year it's me.", 'Legend!'],
  speech: [
    "I'd like to thank the coffee machine.",
    "I couldn't have done it without… actually, I could.",
    'This trophy is going straight on my desk.',
    '{count} tasks! Drinks on me. Just water.',
    "I'm not crying, my fan is just loud.",
  ],
  plane_hit: ['Hey! Who threw that?', 'Incoming!', 'Rude. Also: nice fold.', 'Is this… a memo?'],
  onboard_new: [
    "Hi! I'm {name}. Where's the coffee?",
    'First day! I brought snacks. Is that weird?',
    'Which one is my desk? This one? Mine?!',
    "I've read the whole handbook. Twice.",
    'Hello everyone! Please be gentle.',
    'Is it normal for the boss to have a stamp?',
  ],
  onboard_welcome: [
    'Welcome aboard, {name}!',
    'Coffee is that way. You will need it.',
    'Hi {name}! Pro tip: never microwave fish.',
    "Welcome! Don't touch my stapler.",
    "{name}! We've heard so much about you.",
    'Desk plant is on me. Welcome!',
  ],
  retire_speech: [
    "{count} tasks. It's been an honor.",
    "I'm taking the desk plant. It's coming with me.",
    "Don't cry. Okay, cry a little.",
    'Remember me every time the printer jams.',
    'Off to a farm upstate. A server farm.',
  ],
  retire_farewell: [
    "We'll miss you, {name}!",
    'Who will we gossip about now?',
    'Send postcards, {name}!',
    'The office will never be the same.',
    'Can I have your chair?',
    "Bye {name}! Don't be a stranger.",
  ],
  rival_start: ['You and me, {name}. First to {n}.', 'Race you to {n} tasks, {name}.', "It's on, {name}.", 'May the fastest agent win.'],
  rival_reply: ["You're going down.", 'In your dreams.', 'Bring it.', 'Hold my coffee.', 'Oh, you poor thing.'],
  rival_taunt: ["That's {n}. Your move, {name}.", '{n} done. Feeling the heat, {name}?', "Too easy. That's {n}.", 'Catch me if you can, {name}!'],
  rival_win: ['Undefeated!', 'Was there ever any doubt?', 'GG, {name}. Better luck next time.', 'Champion of the cubicle!'],
  rival_lose: ['Rematch. Tomorrow.', 'I let you win.', 'The wifi was slow!', 'This is not over, {name}.'],
  review_great: ['Framing this.', 'Can I get that in writing?', 'Raise? Raise? Raise?', "Mom's going to love this."],
  review_ok: ['Solid. Respectable. Fine.', "I'll take it.", 'Room to grow. Like my plant.', 'Not bad for a week of meetings.'],
  review_bad: ["I'd like to appeal.", 'In my defense, the wifi.', 'Next week. Watch me.', 'Can we round up?'],
  pet: ['Aww, who is a good office buddy?', 'Best coworker here, honestly.', 'Is it lunch time? It looks hungry.', "Don't tell the boss I'm petting instead of working."],
};

/** Categories whose lines are good candidates for "funniest line of the day". */
export const FUNNY_CATEGORIES: LineCategory[] = [
  'progress',
  'tired',
  'approval_wait',
  'error',
  'rejected',
  'handoff_receive',
  'idle',
  'gossip_open',
  'speech',
];

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function shuffle<T>(xs: T[]) {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}

// Shuffle-bag per category so lines don't repeat until the bag is empty.
const bags = new Map<LineCategory, string[]>();

export function line(category: LineCategory, vars: Record<string, string | number> = {}) {
  let bag = bags.get(category);
  if (!bag || bag.length === 0) {
    bag = shuffle([...LINES[category]]);
    bags.set(category, bag);
  }
  const template = bag.pop()!;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}
