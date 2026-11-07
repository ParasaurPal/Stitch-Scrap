export interface DailyPrompt {
  id: string;
  category: 'nostalgia' | 'reflection' | 'gratitude' | 'scrapbook' | 'creative';
  question: string;
  sparkHint?: string;
}

export const DAILY_PROMPTS: DailyPrompt[] = [
  {
    id: 'p-1',
    category: 'nostalgia',
    question: 'What song, scent, or weather immediately transports you back to an earlier chapter of your life?',
    sparkHint: 'Describe where you were, who was with you, and what that year felt like.',
  },
  {
    id: 'p-2',
    category: 'creative',
    question: 'If today had an album cover and a three-song soundtrack, what would they look and sound like?',
    sparkHint: 'Stick a washi tape strip with your three track titles!',
  },
  {
    id: 'p-3',
    category: 'reflection',
    question: 'What is a quiet comfort you discovered recently that you wish you knew five years ago?',
    sparkHint: 'Could be a morning ritual, a tea recipe, or a mindset shift.',
  },
  {
    id: 'p-4',
    category: 'scrapbook',
    question: 'If you had to preserve three sensory details from this week in an amber jar, what would you put in?',
    sparkHint: 'Think about textures, colors, and fragments of overheard conversations.',
  },
  {
    id: 'p-5',
    category: 'nostalgia',
    question: 'What was your favorite physical object when you were younger, and where is it now?',
    sparkHint: 'A keychain, a concert ticket, a thrifted jacket, or a childhood notebook.',
  },
  {
    id: 'p-6',
    category: 'gratitude',
    question: 'Who is someone whose presence made your day 10% softer or brighter recently?',
    sparkHint: 'Write a small unsent note or dedication to them.',
  },
  {
    id: 'p-7',
    category: 'reflection',
    question: 'What is a question you have been asking yourself lately without expecting an immediate answer?',
    sparkHint: 'Sit with the uncertainty and write what comes to mind.',
  },
  {
    id: 'p-8',
    category: 'creative',
    question: 'Describe your current surroundings using only colors, shadows, and temperatures.',
    sparkHint: 'Pretend you are painting the room with words.',
  },
  {
    id: 'p-9',
    category: 'nostalgia',
    question: 'What website, chatroom, or early internet habit do you secretly miss the most?',
    sparkHint: 'LiveJournal layouts, MSN Messenger away messages, or forum signatures.',
  },
  {
    id: 'p-10',
    category: 'scrapbook',
    question: 'What would the title of this current era of your life be if it were a paperback novel?',
    sparkHint: 'Design a title banner with washi tape and vintage font.',
  },
  {
    id: 'p-11',
    category: 'reflection',
    question: 'What is something you forgave yourself for recently?',
    sparkHint: 'Notice how letting go lightens your shoulders.',
  },
  {
    id: 'p-12',
    category: 'creative',
    question: 'Invent a holiday that should exist, and describe how people celebrate it.',
    sparkHint: 'What are the signature foods, decorations, and greetings?',
  },
  {
    id: 'p-13',
    category: 'gratitude',
    question: 'What ordinary, mundane thing went right today that you usually take for granted?',
    sparkHint: 'The warmth of a mug, hot water in the shower, a green light when running late.',
  },
  {
    id: 'p-14',
    category: 'scrapbook',
    question: 'Capture a fleeting thought or daydream you had while commuting or daydreaming today.',
    sparkHint: 'No need for a plot—just the texture of the thought.',
  },
];

/**
 * Returns a deterministic daily prompt based on the current date,
 * ensuring everyone gets a fresh prompt each calendar day.
 */
export function getPromptForDate(date: Date = new Date()): DailyPrompt {
  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
      (24 * 60 * 60 * 1000)
  );
  const index = Math.abs(dayOfYear) % DAILY_PROMPTS.length;
  return DAILY_PROMPTS[index];
}

/**
 * Returns a random prompt different from the current one.
 */
export function getRandomPrompt(excludeId?: string): DailyPrompt {
  const filtered = excludeId ? DAILY_PROMPTS.filter((p) => p.id !== excludeId) : DAILY_PROMPTS;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex] || DAILY_PROMPTS[0];
}
