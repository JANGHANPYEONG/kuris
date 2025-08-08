// /api/ask: RAG 질의응답 API
// 질문 → intent 분류 → 벡터 검색 → JSON 컨텍스트 → GPT 응답 → 로그 저장

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { classifyIntent } from "@/lib/classify-intent";
import { getEmbedding } from "@/lib/embeddings";
import OpenAI from "openai";

// 번역 데이터
const TRANSLATIONS = {
  en: {
    noAnswer: "Sorry, I cannot generate an answer.",
    parseError: "Unable to parse response.",
    formatError: "Response format error occurred.",
    noInfo:
      "No information available for this topic. Please ask another question.",
  },
  ja: {
    noAnswer: "申し訳ございません。回答を生成できません。",
    parseError: "応答を解析できません。",
    formatError: "応答形式エラーが発生しました。",
    noInfo: "この内容に関する情報がありません。他の質問をしてください。",
  },
  zh: {
    noAnswer: "抱歉，无法生成答案。",
    parseError: "无法解析响应。",
    formatError: "响应格式错误。",
    noInfo: "没有相关信息。请询问其他问题。",
  },
  ko: {
    noAnswer: "죄송합니다. 답변을 생성할 수 없습니다.",
    parseError: "응답을 파싱할 수 없습니다.",
    formatError: "응답 형식 오류가 발생했습니다.",
    noInfo: "해당 내용에 대한 정보가 없습니다. 다른 질문을 해주세요.",
  },
};

// 번역 함수
function t(lang: string, key: keyof typeof TRANSLATIONS.en): string {
  return (
    TRANSLATIONS[lang as keyof typeof TRANSLATIONS]?.[key] ||
    TRANSLATIONS.en[key]
  );
}

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

// 벡터 검색 결과 타입 정의
interface VectorSearchResult {
  id: number;
  json_path: string;
  similarity: number;
  summary?: string;
}

// Blocks JSON 응답 타입 정의
interface Block {
  type: "text" | "link" | "image" | "map";
  text?: string;
  url?: string;
  title?: string;
  description?: string;
}

interface BlocksResponse {
  blocks: Block[];
}

// JSON 컨텍스트 로드 함수
async function loadJsonContexts(jsonPaths: string[]): Promise<JsonContext[]> {
  const contexts: JsonContext[] = [];

  console.log("=== JSON 컨텍스트 로드 시작 ===");
  console.log("로드할 JSON 경로 개수:", jsonPaths.length);

  for (const path of jsonPaths) {
    try {
      console.log(`\nJSON 로드 시도: ${path}`);
      const { data, error } = await supabase.storage
        .from("kuris-json")
        .download(path);

      if (!error && data) {
        const text = await data.text();
        const jsonData = JSON.parse(text) as JsonContext;
        contexts.push(jsonData);
        console.log(`✅ JSON 로드 성공: ${path}`);
        console.log(`  - Title: ${jsonData.title}`);
        console.log(`  - Intent: ${jsonData.intent}`);
      } else {
        console.log(`❌ JSON 로드 실패: ${path}`);
        console.log(`  - Error: ${error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.log(`❌ JSON 파싱 실패: ${path}`);
      console.log(
        `  - Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      console.warn(`Failed to load JSON context from ${path}:`, error);
    }
  }

  console.log(`\n=== JSON 컨텍스트 로드 완료 ===`);
  console.log(`성공적으로 로드된 컨텍스트 개수: ${contexts.length}`);

  return contexts;
}

// GPT Blocks JSON 응답 생성 함수
async function createBlocksAnswer(
  question: string,
  contexts: JsonContext[],
  language: string
): Promise<{
  blocks: Block[];
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
다른 주제(예: 수학 문제, 일반 상식 등)는 "해당 질문은 KUris의 응답 범위를 벗어납니다."고 응답한다.

- 제공된 JSON context 외의 사적 지식(헛웃음, 잡담)은 사용하지 말 것.  
- 질문 언어(한국어·영어·일어·중국어)를 감지해 **같은 언어**로 답변한다.  
- JSON \`summary\` 는 간략 설명, \`details\` 에 필요한 숫자·장소·연락처가 담겨 있다.  
- 반드시 JSON 형식으로 응답하라: { "blocks": [...] }
- blocks 타입: "text"(일반 텍스트), "link"(링크), "image"(이미지), "map"(지도)

## 응답 형식 가이드라인
- **문단 분리**: 각 단계나 주제별로 명확히 문단을 나누어라
- **번호 매기기**: 단계별 설명은 1, 2, 3... 형태로 번호를 매겨라
- **굵은 글씨**: 중요한 키워드나 제목은 **굵은 글씨**로 강조하라
- **줄바꿈**: 각 문단 사이에 적절한 줄바꿈을 넣어라
- **구조화**: 제목 → 설명 → 세부사항 순서로 구조화하라

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
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      blocks: [{ type: "text", text: t(language, "noAnswer") }],
      usage: response.usage,
    };
  }

  try {
    const parsed = JSON.parse(content) as BlocksResponse;
    return {
      blocks: parsed.blocks || [
        { type: "text", text: t(language, "parseError") },
      ],
      usage: response.usage,
    };
  } catch (error) {
    console.error("JSON parsing error:", error);
    return {
      blocks: [{ type: "text", text: t(language, "formatError") }],
      usage: response.usage,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { question, language = "en" } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // ① intent 분류 (주석처리)
    // const intent = await classifyIntent(question);

    // fallback인 경우 "정보 없음" 응답 (주석처리)
    // if (intent.id === "fallback-intent-id") {
    //   return NextResponse.json({
    //     blocks: [
    //       {
    //         type: "text",
    //         text: t(language, "noInfo"),
    //       },
    //     ],
    //     intent: intent.name,
    //     contexts_used: 0,
    //   });
    // }

    // ② FTS 후보 검색 (주석처리)
    // const keywords = extractKeyword(question);
    // const { data: ftsResults } = await supabase
    //   .from("guidelines")
    //   .select("*")
    //   .ilike("summary", `%${keywords}%`)
    //   .limit(5);

    // ③ 벡터 후보 검색 (수정: intent_id 제거)
    console.log("=== 임베딩 생성 ===");
    console.log("질문:", question);
    const qEmb = await getEmbedding(question);
    console.log("임베딩 생성 완료, 길이:", qEmb.length);

    console.log("=== 벡터 검색 호출 ===");

    // 데이터베이스 확인 (디버깅용)
    const { data: allGuidelines, error: checkError } = await supabase
      .from("guidelines")
      .select("id, title, summary, summary_embedding")
      .limit(5);

    if (checkError) {
      console.log("데이터베이스 확인 오류:", checkError);
    }

    const { data: vecResults, error: vecError } = await supabase.rpc(
      "match_guidelines_by_vec",
      {
        intent_id: null, // intent 분류 없이 모든 intent에서 검색
        query_embedding: qEmb,
        match_threshold: 0.3, // 적절한 임계값으로 조정
        match_count: 5, // 더 많은 결과 가져오기
      }
    );

    if (vecError) {
      console.log("벡터 검색 오류:", vecError);
    }

    // 디버깅: 벡터 검색 결과 출력
    console.log("=== 벡터 검색 결과 ===");
    console.log("검색된 row 개수:", vecResults?.length || 0);
    if (vecResults && vecResults.length > 0) {
      (vecResults as VectorSearchResult[]).forEach(
        (result: VectorSearchResult, index: number) => {
          console.log(`Row ${index + 1}:`);
          console.log(`  - ID: ${result.id}`);
          console.log(`  - JSON Path: ${result.json_path}`);
          console.log(`  - Similarity: ${result.similarity}`);
          console.log(`  - Summary: ${result.summary?.substring(0, 100)}...`);
        }
      );
    } else {
      console.log("벡터 검색 결과가 없습니다.");
    }

    // ④ JSON 컨텍스트 로드
    const allResults = [...(vecResults || [])]; // FTS 결과 제거
    const uniquePaths = [...new Set(allResults.map((g) => g.json_path))];

    // 디버깅: JSON 경로 출력
    console.log("=== JSON 경로 ===");
    console.log("고유 JSON 경로 개수:", uniquePaths.length);
    uniquePaths.forEach((path, index) => {
      console.log(`  ${index + 1}. ${path}`);
    });

    const jsonContexts = await loadJsonContexts(uniquePaths);

    // ⑤ GPT Blocks JSON 응답 생성
    let answer;
    const contexts_used = jsonContexts.length;

    if (contexts_used === 0) {
      // Fallback: 컨텍스트가 없을 때 기본 응답
      console.log("=== Fallback 응답 생성 ===");
      answer = {
        blocks: [
          {
            type: "text",
            text: t(language, "noInfo"),
          },
        ],
        usage: undefined,
      };
    } else {
      // 정상적인 GPT 응답 생성
      answer = await createBlocksAnswer(question, jsonContexts, language);
    }

    // ⑥ 로그 저장
    await supabase.from("chat_logs").insert({
      user_id: null, // 익명 사용자
      question,
      answer: JSON.stringify(answer.blocks), // blocks JSON 저장
      intent: contexts_used === 0 ? "fallback" : "vector-only", // fallback 구분
      tokens_in: answer.usage?.prompt_tokens,
      tokens_out: answer.usage?.completion_tokens,
    });

    return NextResponse.json({
      blocks: answer.blocks,
      intent: contexts_used === 0 ? "fallback" : "vector-only",
      contexts_used: contexts_used,
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
