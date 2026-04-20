import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { title, genre, synopsis } = req.body;

  if (!title || !genre || !synopsis) {
    return res.status(400).json({ error: "Title, genre and synopsis are required" });
  }

  const prompt = `You are a professional book marketing copywriter specialising in ${genre} fiction. Generate exactly 3 different book blurbs for "${title}". Each blurb should use a different hook: emotional, action, mystery. Each blurb should be 150-200 words, end with a call-to-action, and be ready to paste into KDP. Respond with valid JSON only, no markdown: {"blurbs":[{"variant":1,"hook":"emotional","text":"..."},{"variant":2,"hook":"action","text":"..."},{"variant":3,"hook":"mystery","text":"..."}]}. Book synopsis: ${synopsis}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Generation failed", detail: error.message });
  }
}
