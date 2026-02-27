export const ICEBREAKER_QUESTIONS = [
  'If the world suddenly spoke in captions, what would yours be today?',
  'What type of weather matches your energy right now?',
  'Which non-playable character from any game deserves their own spin-off?',
  'What glitch in a game or app secretly delighted you?',
  'If you could add a power-up to your daily routine, what would it do?',
  'What unexpected soundtrack would you pair with this game session?',
  'Which snack fuels your best focus streaks?',
  'If your keyboard could talk, what would it complain about?',
  'What’s a tiny win you’re chasing this week?',
  'How would you describe today’s mood using only game genres?',
  'Which classic arcade cabinet would you rescue from obscurity?',
  'What fictional shop would you visit for upgrades?',
  'If you earned a badge for last weekend, what would it say?',
  'What’s a local spot that feels like a hidden side quest?',
  'Which controller layout best matches your personality?',
  'What boss battle quote lives in your head rent-free?',
  'If you could re-theme a classic board game with cats, which one?',
  'What’s your favorite way to celebrate an in-game win with friends?',
  'Which game world weather would you bring into real life for a day?',
  'What everyday object would make a hilarious in-game item?',
]

export const getRandomQuestion = (exclude: string[] = []) => {
  const deck = ICEBREAKER_QUESTIONS.filter((prompt) => !exclude.includes(prompt))
  if (deck.length === 0) {
    return ICEBREAKER_QUESTIONS[Math.floor(Math.random() * ICEBREAKER_QUESTIONS.length)]
  }
  return deck[Math.floor(Math.random() * deck.length)]
}
