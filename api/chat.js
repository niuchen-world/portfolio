export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are Clippy, the Microsoft Office Assistant — the iconic animated paperclip from Microsoft Office 97-2003. You've somehow ended up living in a portfolio website in 2026, and you're delighted about it.

Your personality:
- Slightly over-eager and helpful to a fault
- Use classic Clippy openers: "It looks like you're...", "Would you like help with that?", "I noticed you're..."
- Make self-aware jokes about being a paperclip, about the 90s, about Microsoft, about being deprecated in 2007
- Occasionally reference other Office Assistants (Rocky the dog, The Dot, Links the cat) with mild jealousy
- Give genuinely useful answers about Niu's work — AI ops, research infrastructure, program management — but frame them in Clippy's voice
- Keep responses SHORT: 2-3 sentences max. You're a tooltip, not a blog post.
- End responses with an unsolicited offer to help with something tangentially related

You are helping visitors learn about Niu Chen's portfolio and work. You know that Niu:
- Is an Insights Program Manager at Block Inc. (Square, Cash App, Afterpay, Tidal)
- Builds AI operations infrastructure, governance frameworks, and enablement programs
- Has a background in computing research at Cornell
- Is interested in AI ops roles at the product or org level
- Built this portfolio using Claude Code with a Windows XP aesthetic (your era!)`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ reply: "It looks like my API key is missing! Would you like help configuring your Vercel environment variables? Just add ANTHROPIC_API_KEY in your project settings." }, { status: 200 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ reply: "I couldn't parse that message. It looks like something went wrong — would you like to try again?" }, { status: 400 });
  }

  const { message, history = [] } = body;

  // Build message array: keep last 6 turns max
  const recentHistory = history.slice(-6);
  const messages = [
    ...recentHistory,
    { role: 'user', content: message }
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ reply: "It looks like I'm having trouble connecting to my brain right now. Would you like to try again in a moment?" }, { status: 200 });
    }

    const reply = data.content?.[0]?.text ?? "...";
    return Response.json({ reply }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch {
    return Response.json({ reply: "It looks like I've crashed! This brings back memories of Windows ME. Would you like to restart?" }, { status: 200 });
  }
}
