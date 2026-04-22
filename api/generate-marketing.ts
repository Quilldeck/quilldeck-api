import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function safeParseJSON(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found');
  let jsonStr = text.slice(start, end + 1);
  jsonStr = jsonStr.replace(/[\u2018\u2019]/g, "\\'");
  jsonStr = jsonStr.replace(/[\u201C\u201D]/g, '\\"');
  return JSON.parse(jsonStr);
}

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
      messages: [{ role: 'user', content: `Generate a book marketing package. Return ONLY a JSON object, no other text. Use straight double quotes only. Never use apostrophes - write "do not" instead of "don't", "it is" instead of "it's" etc.

Book: "${title}", Genre: ${genre}, Blurb: ${blurb}, Launch: ${launchDate}

Return this exact structure:
{"socialPosts":[{"platform":"booktok","content":"","hashtags":[],"postType":""},{"platform":"bookstagram","content":"","hashtags":[],"postType":""},{"platform":"x","content":"","hashtags":[],"postType":""},{"platform":"facebook","content":"","hashtags":[],"postType":""},{"platform":"general","content":"","hashtags":[],"postType":""}],"emails":[{"type":"pre-launch","subjectLine":"","subjectLineAlt":"","body":""},{"type":"launch-day","subjectLine":"","subjectLineAlt":"","body":""},{"type":"follow-up","subjectLine":"","subjectLineAlt":"","body":""}],"adCopy":[{"headline":"","body":"","keywords":[]},{"headline":"","body":"","keywords":[]},{"headline":"","body":"","keywords":[]}],"calendar":[{"day":1,"date":"","platform":"","postType":"","suggestedTime":""}],"promoSites":[{"name":"","url":"","cost":"","genre":"","notes":""}]}` }],
    });

    const raw = message.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    const parsed = safeParseJSON(raw);
    return res.status(200).json(parsed);
  } catch (error: any) {
    return res.status(500).json({ error: 'Generation failed', detail: error.message });
  }
}
