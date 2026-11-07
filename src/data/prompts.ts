// Daily Creative Writing Prompts for Stitch & Scrap Journal
// A rich bank of nostalgic, introspective, sensory, and creative prompts for each day of the year.

export interface DailyPrompt {
  id: string;
  category: 'nostalgia' | 'reflection' | 'sensory' | 'creative' | 'gratitude' | 'future';
  question: string;
  subtext?: string;
  tag?: string;
}

export const DAILY_PROMPTS: DailyPrompt[] = [
  {
    id: 'p-1',
    category: 'nostalgia',
    question: 'What is a small sound from your childhood that you haven’t heard in years?',
    subtext: 'The hum of an old refrigerator, gravel under bicycle tires, dial-up internet chimes...',
    tag: 'Soundtrack of the Past',
  },
  {
    id: 'p-2',
    category: 'sensory',
    question: 'Describe the sky right now as if you were explaining color to someone who has only seen black and white.',
    subtext: 'Look out the window or picture the weather outside today.',
    tag: 'Atmosphere',
  },
  {
    id: 'p-3',
    category: 'reflection',
    question: 'What song currently feels like warm sunlight on your shoulders?',
    subtext: 'Put it on repeat, add it to your Listening To stamp, and jot down what it stirs up.',
    tag: 'Mixtape Notes',
  },
  {
    id: 'p-4',
    category: 'creative',
    question: 'If today was an indie movie, what would the opening scene and title be?',
    subtext: 'Who is walking in? What coffee cup are they holding? What is playing in the background?',
    tag: 'Cinematic Mood',
  },
  {
    id: 'p-5',
    category: 'nostalgia',
    question: 'Recall an old bedroom or sacred corner from your past. What was taped to the walls?',
    subtext: 'Band posters, torn magazine pages, postcards, glow-in-the-dark ceiling stars...',
    tag: 'Early Bedroom Shrine',
  },
  {
    id: 'p-6',
    category: 'gratitude',
    question: 'What is an ordinary convenience or tiny ritual that quietly made today better?',
    subtext: 'Fresh hot coffee, clean socks, a soft blanket, a text message from a friend.',
    tag: 'Micro-Joy',
  },
  {
    id: 'p-7',
    category: 'reflection',
    question: 'What is a thought or feeling you have been carrying lately that needs a place to rest?',
    subtext: 'Unload it onto this blank page; let paper hold the weight for a while.',
    tag: 'Emotional Release',
  },
  {
    id: 'p-8',
    category: 'creative',
    question: 'Write a quick postcard message to your future self exactly five years from today.',
    subtext: 'Where are you writing from? What do you hope they haven’t forgotten?',
    tag: 'Time Capsule',
  },
  {
    id: 'p-9',
    category: 'sensory',
    question: 'What did the air smell like when you first stepped outside today?',
    subtext: 'Rain-soaked asphalt, cold morning fog, roasted coffee beans, fallen autumn leaves...',
    tag: 'Sensory Trace',
  },
  {
    id: 'p-10',
    category: 'nostalgia',
    question: 'What snack or candy instantly teleports you back to being eight years old?',
    subtext: 'Popsicles on sticky summer sidewalks, corner-store penny candy, boxed juice...',
    tag: 'Taste Memory',
  },
  {
    id: 'p-11',
    category: 'creative',
    question: 'Invent a word for a feeling that doesn’t have a name in English yet.',
    subtext: 'Define it, pronounce it, and explain when you last felt it.',
    tag: 'Dictionary of Solace',
  },
  {
    id: 'p-12',
    category: 'reflection',
    question: 'What is something you believed with certainty three years ago that you now see differently?',
    subtext: 'How did the change feel as it unfolded?',
    tag: 'Quiet Evolution',
  },
  {
    id: 'p-13',
    category: 'sensory',
    question: 'Close your eyes for ten seconds. List five distinct things you can hear right now.',
    subtext: 'The distant traffic, keyboard clicks, wind against glass, breath, refrigerator hum.',
    tag: 'Present Moment',
  },
  {
    id: 'p-14',
    category: 'nostalgia',
    question: 'What was your favorite song to put on your blog, profile, or burner CD when you were a teenager?',
    subtext: 'Why did that specific chorus feel like it defined your soul?',
    tag: 'LiveJournal Mixtape',
  },
  {
    id: 'p-15',
    category: 'creative',
    question: 'If you could spend one undisturbed hour in any place on Earth right now, where would you be sitting?',
    subtext: 'Describe the chair, the light, the view, and what you’re holding in your hands.',
    tag: 'Sanctuary',
  },
  {
    id: 'p-16',
    category: 'reflection',
    question: 'Who is someone you haven’t spoken to in a while whose presence still echoes in how you live?',
    subtext: 'A habit they taught you, a phrase they repeated, a book they handed you.',
    tag: 'Keepsake People',
  },
  {
    id: 'p-17',
    category: 'gratitude',
    question: 'What is something that went right today, even if it was tiny or unexpected?',
    subtext: 'Catching the green light, finding a warm pen, a moment of peaceful quiet.',
    tag: 'Daily Grace',
  },
  {
    id: 'p-18',
    category: 'creative',
    question: 'Write down a conversation you overheard or imagined between two strangers today.',
    subtext: 'What were they arguing or giggling about in the grocery aisle or subway car?',
    tag: 'Fly on the Wall',
  },
  {
    id: 'p-19',
    category: 'future',
    question: 'What kind of season of life do you hope you are stepping into right now?',
    subtext: 'A season of building, a season of resting, a season of exploration, or healing?',
    tag: 'Inner Compass',
  },
  {
    id: 'p-20',
    category: 'sensory',
    question: 'Describe your favorite texture in the room right now.',
    subtext: 'Is it knit wool, cool glass, worn wood grain, paper tooth, or velvet?',
    tag: 'Tactile Notes',
  },
  {
    id: 'p-21',
    category: 'nostalgia',
    question: 'What was your first favorite book that you read until the cover started falling off?',
    subtext: 'What did the world inside those pages feel like when you were reading by flashlight?',
    tag: 'Flashlight Reader',
  },
  {
    id: 'p-22',
    category: 'reflection',
    question: 'If you had to give today a honest rating out of 10, what would you give it, and why the fraction?',
    subtext: 'e.g., 7.4 / 10 because morning coffee was heaven but afternoon traffic was a slog.',
    tag: 'The Daily Decimal',
  },
  {
    id: 'p-23',
    category: 'creative',
    question: 'What would the mascot or spirit animal of your brain be today?',
    subtext: 'A sleepy golden retriever, a squirrel organizing acorn files, a nocturnal owl?',
    tag: 'Brain Animal',
  },
  {
    id: 'p-24',
    category: 'gratitude',
    question: 'What is one piece of art (song, poem, drawing, film) you are genuinely grateful exists in this world?',
    subtext: 'When was the first time it found you?',
    tag: 'Artistic Lifeline',
  },
];

/**
 * Returns the prompt of the day based on the calendar day of the year (1-366)
 * so every user gets a new, deterministic creative writing question each day.
 */
export function getPromptForDate(date: Date = new Date()): DailyPrompt {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = Math.abs(dayOfYear) % DAILY_PROMPTS.length;
  return DAILY_PROMPTS[index];
}

/**
 * Returns a random prompt from the prompt bank.
 */
export function getRandomPrompt(currentId?: string): DailyPrompt {
  const filtered = DAILY_PROMPTS.filter((p) => p.id !== currentId);
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex] || DAILY_PROMPTS[0];
}
