import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { title, genre, blurb, launchDate, website } = req.body;
  if (!title || !genre) return res.status(400).json({ error: 'Missing fields' });
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: 'Return only valid JSON, no markdown, no backticks, no apostrophes in values. Generate a marketing package for: Title: ${title}, Genre: ${genre}, Blurb: ${blurb}, Launch: ${launchDate}. - Author website ${website}. Structure: {"socialPosts":[{"platform":"booktok","content":"...","hashtags":["tag"]}],"emails":[{"type":"pre-launch","subjectLine":"...","subjectLineAlt":"...","body":"..."}],"adCopy":[{"headline":"...","body":"...","keywords":["kw"]}],"calendar":[{"day":1,"date":"Day 1","platform":"X","postType":"teaser","content":"..."}],"promoSites":[{"name":"BookBub","url":"https://bookbub.com","cost":"varies","genre":"${genre}","notes":"..."}]}. Include 5 socialPosts, 3 emails, 3 adCopy, 14 calendar days, 5 promoSites.' }],
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