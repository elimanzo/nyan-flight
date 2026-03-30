export const ICEBREAKER_QUESTIONS = [
  "If animals could talk, which one would be the rudest?",
  "What would your villain name be?",
  "If you had to fight one inanimate object, what would it be?",
  "What’s a completely useless talent you have?",
  "If your life were a reality show, what would it be called?",
  "What’s the weirdest food combination you actually enjoy?",
  "If you could replace handshakes with something else, what would it be?",
  "What’s something that feels illegal but isn’t?",
  "If your pet had a job, what would it be?",
  "What would your warning label say?",
  "If you were a ghost, how would you haunt people?",
  "What’s the most ridiculous fear you have?",
  "If you could rename yourself for a day, what would you pick?",
  "What would your theme song be when you walk into a room?",
  "If chairs had personalities, what type would yours be?",
  "What’s the funniest lie you’ve ever told?",
  "If you had to swap lives with a cartoon character, who would it be?",
  "What’s something you’re weirdly competitive about?",
  "If your life had a pause button, what would you use it for first?",
  "What’s the most random thing you’ve Googled recently?",
];

export const getRandomQuestion = (exclude: string[] = []) => {
  const deck = ICEBREAKER_QUESTIONS.filter(
    (prompt) => !exclude.includes(prompt),
  );
  if (deck.length === 0) {
    return ICEBREAKER_QUESTIONS[
      Math.floor(Math.random() * ICEBREAKER_QUESTIONS.length)
    ];
  }
  return deck[Math.floor(Math.random() * deck.length)];
};
