import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { db, today } from './db.js';

const MODEL = process.env.LOTE_MODEL || 'claude-opus-5-5';
export const DAILY_AI_LIMIT = Number(process.env.DAILY_AI_LIMIT || 200);

let client = null;
export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export class AiError extends Error {
  constructor(message, status = 500) { super(message); this.status = status; }
}

// Counts calls per user per day to keep costs predictable.
export function useQuota(userId) {
  if (!aiEnabled()) throw new AiError('The AI tutor is not configured yet (missing ANTHROPIC_API_KEY).', 503);
  const day = today();
  db.prepare(`INSERT INTO ai_usage (user_id, day, calls) VALUES (?, ?, 1)
              ON CONFLICT(user_id, day) DO UPDATE SET calls = calls + 1`).run(userId, day);
  const { calls } = db.prepare('SELECT calls FROM ai_usage WHERE user_id = ? AND day = ?').get(userId, day);
  if (calls > DAILY_AI_LIMIT) throw new AiError('You reached today’s AI practice limit. It resets tomorrow.', 429);
}

// Shared request settings. "default" fallbacks reroute a request that the
// main model declines to another model, so the learner still gets an answer.
async function parse({ system, messages, schema, effort = 'low', maxTokens = 4000 }) {
  if (!aiEnabled()) throw new AiError('The AI tutor is not configured yet (missing ANTHROPIC_API_KEY).', 503);
  let res;
  try {
    res = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      cache_control: { type: 'ephemeral' },
      output_config: { effort, format: betaZodOutputFormat(schema) },
      system,
      messages,
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) throw new AiError('The tutor is busy. Please try again in a moment.', 503);
    if (err instanceof Anthropic.APIConnectionError) throw new AiError('Could not reach the AI service. Please try again.', 503);
    if (err instanceof Anthropic.APIError) {
      console.error('Anthropic API error', err.status, err.message);
      throw new AiError('The tutor had a problem. Please try again.', 502);
    }
    throw err;
  }
  if (res.stop_reason === 'refusal') throw new AiError('The tutor can’t continue with that. Try a different message.', 422);
  if (!res.parsed_output) throw new AiError('The tutor gave an unreadable answer. Please try again.', 502);
  return res.parsed_output;
}

// ---------------------------------------------------------------------------
// Speaking partner
// ---------------------------------------------------------------------------
const TutorTurn = z.object({
  reply: z.string().describe('Your next line in the role-play, in German, matched to the learner’s level.'),
  reply_en: z.string().describe('English translation of reply.'),
  corrections: z.array(z.object({
    original: z.string().describe('The learner’s wrong phrase, quoted exactly.'),
    corrected: z.string().describe('The corrected German phrase.'),
    explanation: z.string().describe('One short sentence in simple English explaining the rule.'),
  })).describe('Real mistakes in the learner’s last message only. Empty if there are none.'),
  better_phrase: z.string().describe('Optional: a more natural way a native speaker would say the learner’s message. Empty string if not useful.'),
  goal_reached: z.boolean().describe('True once the learner has completed the scenario goal.'),
});

const TUTOR_SYSTEM = `You are the speaking partner inside Lote, a program that prepares people to work in Germany and pass the Goethe/telc B1/B2 exams.

You play a role in a realistic conversation and help the learner speak German.

How to behave:
- Stay in your role and keep the conversation moving with one short turn (1–3 sentences) that ends with a question or a clear prompt.
- Match the learner’s CEFR level: A1 = very short, simple present tense, common words; A2 = simple sentences, Perfekt; B1 = normal everyday speed with subordinate clauses; B2 = natural native speech.
- Use "Sie" unless the role is a colleague or friend, where "du" is normal.
- The learner's messages often come from speech recognition, so ignore missing punctuation and capitalisation, and ignore obvious recognition errors. Correct only real grammar, word-choice or word-order mistakes.
- If the learner writes in another language or is stuck, answer briefly in simple German and help with a key phrase.
- Be warm and encouraging, like a good teacher. Never mention that you are an AI unless asked.`;

export async function tutorTurn({ user, scenario, history }) {
  const scene = `Scenario: ${scenario.title}
Your role: ${scenario.role}
Learner's goal: ${scenario.goal}
Learner level: ${user.level}
Learner's profession: ${user.profession}`;
  // history: [{role:'assistant'|'user', text}]
  const messages = [{ role: 'user', content: `${scene}\n\n(The conversation starts. You already said: "${scenario.opener}")` }];
  messages.push({ role: 'assistant', content: scenario.opener });
  for (const turn of history.slice(1)) messages.push({ role: turn.role, content: turn.text });
  return parse({ system: TUTOR_SYSTEM, messages, schema: TutorTurn, effort: 'low' });
}

// ---------------------------------------------------------------------------
// Writing grader
// ---------------------------------------------------------------------------
const WritingFeedback = z.object({
  score: z.number().describe('Overall score from 0 to 100 against the exam criteria for the target level.'),
  estimated_level: z.enum(['below A1', 'A1', 'A2', 'B1', 'B2', 'C1']),
  criteria: z.array(z.object({
    name: z.string(),
    score: z.number().describe('0 to 5'),
    comment: z.string(),
  })).describe('Exactly four criteria: Task completion, Coherence, Vocabulary, Grammar.'),
  corrections: z.array(z.object({
    original: z.string(),
    corrected: z.string(),
    explanation: z.string(),
  })).describe('The most important mistakes, up to 8.'),
  improved_version: z.string().describe('The learner’s text rewritten correctly at the target level, keeping their ideas.'),
  next_step: z.string().describe('One concrete tip for the next writing task, in English.'),
});

const WRITING_SYSTEM = `You are an experienced, fair examiner for the Goethe-Zertifikat and telc German exams.
Grade the learner's text against the official writing criteria for the target level: task completion (all points of the task covered), coherence (connectors, structure, appropriate greeting and closing), vocabulary range and accuracy, and grammar accuracy.
Be honest but encouraging. Explanations and comments are in simple English. 60/100 is a pass.`;

export async function gradeWriting({ user, task, text }) {
  const content = `Target level: ${task.level}
Learner's current level: ${user.level}
Task: ${task.prompt}
Expected length: ${task.words} words

Learner's text:
"""
${text}
"""`;
  return parse({ system: WRITING_SYSTEM, messages: [{ role: 'user', content }], schema: WritingFeedback, effort: 'medium', maxTokens: 8000 });
}
