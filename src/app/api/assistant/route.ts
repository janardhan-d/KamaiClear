import { NextResponse } from 'next/server';
import { assistantReply, interpretAssistantCommand } from '@/lib/assistant';
import type { AssistantContext, AssistantLanguage, AssistantCommand } from '@/lib/assistant';

const ALLOWED_VIEWS = new Set(['overview', 'log', 'history', 'receipt']);
const ALLOWED_FIELDS = new Set(['date', 'platform', 'hours', 'waitingHours', 'orders', 'kilometres', 'payout', 'tips', 'incentives', 'fuel', 'maintenance', 'phone', 'otherCost', 'note']);
const NUMERIC_FIELDS = new Set(['hours', 'waitingHours', 'orders', 'kilometres', 'payout', 'tips', 'incentives', 'fuel', 'maintenance', 'phone', 'otherCost']);
type AssistantRequest = { message?: string; language?: AssistantLanguage; context?: AssistantContext };

function safeAction(value: unknown): AssistantCommand['action'] {
  if (!value || typeof value !== 'object') return { type: 'none' };
  const action = value as Record<string, unknown>;
  if (action.type === 'navigate' && typeof action.view === 'string' && ALLOWED_VIEWS.has(action.view)) {
    return { type: 'navigate', view: action.view as 'overview' | 'log' | 'history' | 'receipt' };
  }
  if (action.type === 'save_shift') return { type: 'save_shift' };
  if (action.type === 'fill_shift' && action.fields && typeof action.fields === 'object') {
    const fields = Object.fromEntries(Object.entries(action.fields as Record<string, unknown>).filter(([key, value]) => ALLOWED_FIELDS.has(key) && ['string', 'number'].includes(typeof value)).map(([key, value]) => [key, NUMERIC_FIELDS.has(key) ? Number(value) : value]));
    return { type: 'fill_shift', fields };
  }
  return { type: 'none' };
}

function extractJson(content: string) {
  const fenced = content.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? content;
  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let input: AssistantRequest = {};
  try {
    input = await request.json() as AssistantRequest;
    const body = input;
    const message = body.message?.trim();
    const language = body.language ?? 'en-IN';
    const context = body.context ?? { shifts: [], currentView: 'overview' };

    if (!message) return NextResponse.json({ error: 'A message is required.' }, { status: 400 });

    const apiKey = process.env.AI_API_KEY;
    const baseUrl = (process.env.AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = process.env.AI_MODEL ?? 'gpt-4o-mini';

    if (!apiKey) {
      return NextResponse.json({ ...interpretAssistantCommand(message, language, context), source: 'local-action-model' });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are KamaiClear Assistant, a careful action assistant for gig workers. Reply in language ${language}. Use simple words. Never invent earnings. Return only JSON with this shape: {"response":"short user-facing answer","action":{"type":"none|navigate|fill_shift|save_shift","view":"overview|log|history|receipt","fields":{}},"confidence":0.0}. Only fill fields when the user clearly provides them. Never save without an explicit save/confirm request. Valid fields: date, platform, hours, waitingHours, orders, kilometres, payout, tips, incentives, fuel, maintenance, phone, otherCost, note. Current view: ${context.currentView}. Current recorded shifts: ${JSON.stringify(context.shifts.slice(0, 8))}`,
          },
          { role: 'user', content: message },
        ],
      }),
      cache: 'no-store',
    });

    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = extractJson(payload.choices?.[0]?.message?.content ?? '');
    if (!parsed || typeof parsed.response !== 'string') throw new Error('AI provider returned an invalid action response');

    return NextResponse.json({ response: parsed.response, action: safeAction(parsed.action), confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8, source: 'live-model' });
  } catch (error) {
    const body = input;
    const fallback = body.message ? interpretAssistantCommand(body.message, body.language ?? 'en-IN', body.context ?? { shifts: [], currentView: 'overview' }) : { response: assistantReply('help', 'en-IN', { shifts: [], currentView: 'overview' }), action: { type: 'none' as const }, confidence: 0.5 };
    return NextResponse.json({ ...fallback, source: 'local-fallback', warning: error instanceof Error ? error.message : 'Live model unavailable.' });
  }
}
