import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: any, res: any) {
  // Allow cross-origin requests from the app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, genre, synopsis } = req.body;

  if (!title || !genre || !synopsis) {
    return res.status(400).json({ error: 'Title, genre and synopsis are required' });
  }

  const prompt = `You are a professional book marketing copywriter specialising in ${genre} fiction.

Generate exactly 3 different book blurbs for an indie author's novel. Each blurb should use a different hook strategy:

1. EMOTIONAL HOOK — Lead with the character's emotional stakes
2. ACTION HOOK — Lead with the inciting incident or central conflict
3. MYSTERY HOOK — Lead with an intriguing question or enigma

Book details:
- Title: "${title}"
- Genre: ${genre}
- Synopsis: ${synopsis}

Requirements for EACH blurb:
- 150-200 words (Amazon optimal length)
- End with a compelling call-to-action line
- Include genre-appropriate tone and language
- Be ready to paste directly into KDP
- No spoilers beyond Act 1

Respond in this exact JSON format (no markdown, no backticks):
{
  "blurbs": [
    { "variant": 1, "hook": "emotional", "text": "Full blurb text here..." },
    { "variant": 2, "hook": "action", "text": "Full blurb text here..." },
    { "variant": 3, "hook": "mystery", "text": "Full blurb text here..." }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Generation failed' });
  }
}
