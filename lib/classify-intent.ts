// classify-intent.ts: 질문 intent 분류

import OpenAI from "openai";
import { supabase } from "./supabaseClient";
import { fallbackIntentClassification } from "./fallback-intent";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function classifyIntent(
  question: string
): Promise<{ id: string; name: string }> {
  try {
    // 1. GPT-4o mini로 intent 분류 시도
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

    // 2. Supabase DB의 intents 테이블에서 조회 또는 생성
    const { data: intentRow, error: intentError } = await supabase
      .from("intents")
      .upsert(
        { name: intentName },
        { onConflict: "name", ignoreDuplicates: false }
      )
      .select("id, name")
      .single();

    if (intentError) {
      console.error("Intent DB error:", intentError);
      // fallback: 키워드 기반 분류
      return await fallbackIntentClassification(question);
    }

    return {
      id: intentRow.id,
      name: intentRow.name,
    };
  } catch (error) {
    console.error("GPT classification error:", error);
    // fallback: 키워드 기반 분류
    return await fallbackIntentClassification(question);
  }
}
