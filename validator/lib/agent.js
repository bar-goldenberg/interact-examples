import { query } from '@anthropic-ai/claude-agent-sdk';

export function extractHtml(text) {
  let t = String(text).trim();
  const fence = t.match(/^```(?:html)?\s*\n([\s\S]*?)\n```$/i);
  if (fence) t = fence[1];
  return t.trim();
}

export async function runAgent(system, user, { model } = {}) {
  const options = {
    systemPrompt: system,
    allowedTools: [],
    maxTurns: 1,
    permissionMode: 'default',
  };
  if (model) options.model = model;

  let resultText = '';
  let assistantText = '';
  for await (const msg of query({ prompt: user, options })) {
    if (msg.type === 'assistant') {
      for (const block of msg.message.content) {
        if (block.type === 'text') assistantText += block.text;
      }
    } else if (msg.type === 'result') {
      if (msg.subtype === 'success') resultText = msg.result;
      else throw new Error(`agent error: ${msg.subtype}`);
    }
  }
  return resultText || assistantText;
}
