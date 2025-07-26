import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callOpenAI({
  messages,
  model = "gpt-4o-mini",
  temperature = 0.2,
  max_tokens = 512,
}: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}): Promise<string> {
  const res = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens,
  });
  return res.choices[0]?.message?.content || "";
}
