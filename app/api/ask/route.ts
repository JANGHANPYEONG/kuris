// /api/ask: RAG 질의응답 API
// 질문 → intent 분류 → 벡터 검색 → JSON 컨텍스트 → GPT 응답 → 로그 저장

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { classifyIntent } from "@/lib/classify-intent";
import { getEmbedding } from "@/lib/embeddings";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 키워드 추출 함수
function extractKeyword(question: string): string {
  // 간단한 키워드 추출 (실제로는 더 정교한 NLP 사용)
  const keywords = question.split(/\s+/).filter((word) => word.length > 2);
  return keywords.slice(0, 3).join(" ");
}

// JSON 컨텍스트 타입 정의
interface JsonContext {
  intent: string;
  title: string;
  summary: string;
  details: Record<string, unknown>;
  original_input: string;
  created_at: string;
}

// JSON 컨텍스트 로드 함수
async function loadJsonContexts(jsonPaths: string[]): Promise<JsonContext[]> {
  const contexts: JsonContext[] = [];

  for (const path of jsonPaths) {
    try {
      const { data, error } = await supabase.storage
        .from("kuris-json")
        .download(path);

      if (!error && data) {
        const text = await data.text();
        const jsonData = JSON.parse(text) as JsonContext;
        contexts.push(jsonData);
      }
    } catch (error) {
      console.warn(`Failed to load JSON context from ${path}:`, error);
    }
  }

  return contexts;
}

// GPT 응답 생성 함수
async function createAnswer(
  question: string,
  contexts: JsonContext[]
): Promise<{
  text: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}> {
  const contextBlocks = contexts
    .map(
      (ctx, i) =>
        `<doc id="guideline_${i + 1}">\nsummary: ${
          ctx.summary
        }\ndetails: ${JSON.stringify(ctx.details, null, 2)}\n</doc>`
    )
    .join("\n\n");

  const systemPrompt = `# System
너는 KUris 챗봇이다.  
반드시 "교환학생 · 학교생활 · 행정" 관련 질문에만 답한다.  
다른 주제(예: 수학 문제, 일반 상식 등)는 "해당 질문은 KUris 범위를 벗어난다"고 응답한다.

- 제공된 JSON context 외의 사적 지식(헛웃음, 잡담)은 사용하지 말 것.  
- 질문 언어(한국어·영어·일어·중국어)를 감지해 **같은 언어**로 답변한다.  
- JSON \`summary\` 는 간략 설명, \`details\` 에 필요한 숫자·장소·연락처가 담겨 있다.  
- 필요하면 다음 함수를 사용할 수 있다:
    • get_executive_profile(name?)
    • naver_map_search(query)
    • call_office(name?)
- 함수 결과를 반영해 완성된 자연어 답변을 출력한다.

## JSON Context
${contextBlocks}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return {
    text:
      response.choices[0]?.message?.content ||
      "죄송합니다. 답변을 생성할 수 없습니다.",
    usage: response.usage,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // ① intent 분류
    const intent = await classifyIntent(question);

    // ② FTS 후보 검색
    const keywords = extractKeyword(question);
    const { data: ftsResults } = await supabase
      .from("guidelines")
      .select("*")
      .ilike("summary", `%${keywords}%`)
      .limit(5);

    // ③ 벡터 후보 검색
    const qEmb = await getEmbedding(question);
    const { data: vecResults } = await supabase.rpc("match_guidelines_by_vec", {
      intent_id: intent.id,
      query_embedding: qEmb,
      match_threshold: 0.8,
      match_count: 3,
    });

    // ④ JSON 컨텍스트 로드
    const allResults = [...(ftsResults || []), ...(vecResults || [])];
    const uniquePaths = [...new Set(allResults.map((g) => g.json_path))];
    const jsonContexts = await loadJsonContexts(uniquePaths);

    // ⑤ GPT 응답 생성
    const answer = await createAnswer(question, jsonContexts);

    // ⑥ 로그 저장
    await supabase.from("chat_logs").insert({
      user_id: null, // 익명 사용자
      question,
      answer: answer.text,
      intent: intent.name,
      tokens_in: answer.usage?.prompt_tokens,
      tokens_out: answer.usage?.completion_tokens,
    });

    return NextResponse.json({
      answer: answer.text,
      intent: intent.name,
      contexts_used: jsonContexts.length,
    });
  } catch (error) {
    console.error("Ask API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
