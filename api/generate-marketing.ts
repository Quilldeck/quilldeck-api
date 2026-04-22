import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, genre, blurb, launchDate } = req.body;
  if (!title || !genre || !blurb || !launchDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: `Generate a complete book marketing package for: Title: "${title}", Genre: ${genre}, Blurb: ${blurb}, Launch: ${launchDate}. Respond in JSON only with keys: socialPosts, emails, adCopy, calendar, promoSites.` }],
    });

    const raw = message.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    const parsed = JSON.parse(raw.slice(start, end + 1));
    return res.status(200).json(parsed);
  } catch (error: any) {
    return res.status(500).json({ error: 'Generation failed', detail: error.message });
  }
}
