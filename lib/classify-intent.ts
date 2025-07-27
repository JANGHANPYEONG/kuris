// classify-intent.ts: 질문 intent 분류

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function classifyIntent(
  question: string
): Promise<{ id: string; name: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant that classifies KUris (Korea University exchange student) questions into intent categories.
        Return only the intent name from these categories:
        - life/food: food, restaurants, daily life, shopping
        - visa/arc: visa, ARC, immigration, documents
        - academic: classes, grades, registration, study
        - housing: dormitory, apartment, accommodation
        - transportation: bus, subway, taxi, travel
        - health: medical, hospital, insurance
        - emergency: urgent situations, accidents, help`,
      },
      {
        role: "user",
        content: `Classify this question: ${question}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 50,
  });

  const intentName =
    response.choices[0]?.message?.content?.trim() || "life/food";

  // 기본 intent 반환 (실제로는 DB에서 조회해야 함)
  return {
    id: "default-intent-id", // 실제로는 DB에서 조회
    name: intentName,
  };
}
