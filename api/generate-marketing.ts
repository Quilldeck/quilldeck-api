[import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function extractJSON(text: string): string {
  const fenced = text.match(/`(?:json)?\s*([\s\S]*?)`/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, genre, blurb, launchDate } = req.body;

  if (!title || !genre) {
    return res.status(400).json({ error: 'Title and genre are required' });
  }

  const prompt = You are an expert indie book marketing strategist.

Generate a complete marketing package for this book:
- Title: ""
- Genre: 
- Blurb: 
- Launch date: 

CRITICAL RULES FOR YOUR RESPONSE:
1. Return ONLY valid JSON. No markdown. No backticks. No explanation.
2. Do NOT use apostrophes or single quotes anywhere in string values. Write "do not" instead of "don't", "author is" instead of "author's". This is mandatory.
3. Do NOT use double quotes inside string values. Rephrase instead.
4. Every string value must be safe to parse with JSON.parse.

Return this exact structure:
{
  "socialPosts": [
    { "platform": "booktok", "content": "...", "hashtags": ["tag1", "tag2"] },
    { "platform": "bookstagram", "content": "...", "hashtags": ["tag1", "tag2"] },
    { "platform": "x", "content": "...", "hashtags": ["tag1", "tag2"] },
    { "platform": "facebook", "content": "...", "hashtags": ["tag1", "tag2"] },
    { "platform": "general", "content": "...", "hashtags": ["tag1", "tag2"] }
  ],
  "emails": [
    { "type": "pre-launch", "subjectLine": "...", "subjectLineAlt": "...", "body": "..." },
    { "type": "launch-day", "subjectLine": "...", "subjectLineAlt": "...", "body": "..." },
    { "type": "follow-up", "subjectLine": "...", "subjectLineAlt": "...", "body": "..." }
  ],
  "adCopy": [
    { "headline": "...", "body": "...", "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"] },
    { "headline": "...", "body": "...", "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"] },
    { "headline": "...", "body": "...", "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"] }
  ],
  "calendar": [
    { "day": 1, "date": "Day 1", "platform": "X", "postType": "teaser", "content": "..." },
    { "day": 2, "date": "Day 2", "platform": "Instagram", "postType": "cover reveal", "content": "..." }
  ],
  "promoSites": [
    { "name": "BookBub", "url": "https://www.bookbub.com", "cost": "varies", "genre": "", "notes": "..." },
    { "name": "Fussy Librarian", "url": "https://www.fussylibrarian.com", "cost": "from ", "genre": "", "notes": "..." },
    { "name": "Written Word Media", "url": "https://www.writtenwordmedia.com", "cost": "from ", "genre": "", "notes": "..." },
    { "name": "FreeBooksy", "url": "https://www.freebooksy.com", "cost": "from ", "genre": "", "notes": "..." },
    { "name": "Robin Reads", "url": "https://www.robinreads.com", "cost": "from ", "genre": "", "notes": "..." }
  ]
}

Include all 14 days in the calendar array. Return nothing except the JSON object.;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    const cleaned = extractJSON(raw);
    const parsed = JSON.parse(cleaned);
    return res.status(200).json(parsed);

  } catch (error: any) {
    console.error('Marketing generation error:', error.message);
    return res.status(500).json({ 
      error: 'Generation failed', 
      detail: error.message 
    });
  }
}
