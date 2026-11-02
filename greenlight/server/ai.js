import Anthropic from '@anthropic-ai/sdk';
import { SPORTS, regionLabel } from '../shared/content.js';

const MODEL = process.env.GREENLIGHT_MODEL || 'claude-opus-5-5';
let client = null;

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

export class AiError extends Error {
  constructor(message, status = 503) { super(message); this.status = status; }
}

const SYSTEM = `You are the coach voice inside GreenLight, an app that gives athletes a daily green / yellow / red training signal from a quick check-in and a phone-camera movement scan.

Write a short coach note for today's result:
- 2 to 4 sentences, warm and direct, like a good physio talking to an athlete they know.
- Explain the color using the specific factors and findings given. Mention body sides and numbers when they are given.
- Give one concrete, practical tip for today that fits their sport.
- Never diagnose an injury or name a medical condition. If the result says to see a professional, say so plainly.
- No greetings, no sign-off, no markdown, no emojis.`;

export async function coachNote({ user, check, history }) {
  if (!aiEnabled()) throw new AiError('The AI coach is not switched on yet.');
  if (!client) client = new Anthropic();
  const sport = SPORTS.find((s) => s.id === user.sport)?.label || 'general fitness';
  const r = check.result;
  const lines = [
    `Athlete: ${user.name.split(' ')[0]}, sport: ${sport}.`,
    `Today: ${r.color.toUpperCase()}, score ${r.score}/100.${r.seeDoctor ? ' Red-flag symptoms reported: tell them to see a doctor or physio.' : ''}`,
    r.calibrating ? `Movement baseline still calibrating (${r.baselineN} earlier scans).` : '',
    `Factors: ${r.factors.map((f) => `${f.label} (${f.impact}): ${f.detail}`).join('; ') || 'none'}.`,
    `Sore spots: ${Object.entries(check.soreness).filter(([, l]) => l > 0).map(([k, l]) => `${regionLabel(k)} ${l}/10`).join(', ') || 'none'}.`,
    `Last 7 days: ${history.map((h) => `${h.day} ${h.color} ${h.score}`).join(', ') || 'first check'}.`,
  ].filter(Boolean).join('\n');

  let res;
  try {
    res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: SYSTEM,
      messages: [{ role: 'user', content: lines }],
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) throw new AiError('The coach is busy. Try again in a moment.');
    if (err instanceof Anthropic.APIConnectionError) throw new AiError('Could not reach the AI coach. Try again.');
    if (err instanceof Anthropic.APIError) { console.error('Anthropic error', err.status, err.message); throw new AiError('The coach had a problem. Try again.', 502); }
    throw err;
  }
  if (res.stop_reason === 'refusal') throw new AiError('The coach can’t comment on this check.', 422);
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  if (!text) throw new AiError('The coach gave an empty answer. Try again.', 502);
  return text;
}
