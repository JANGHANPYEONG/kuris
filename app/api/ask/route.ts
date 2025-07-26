import { NextRequest, NextResponse } from "next/server";
import { classifyIntent } from "@/lib/classify-intent";
import { loadJsonContext } from "@/lib/load-json-context";
import { runTools } from "@/lib/tools";
import { callOpenAI } from "@/lib/openai";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { question, lang } = await req.json();
  if (!question) {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  // 1. intent 분류
  const intent = await classifyIntent(question, lang);

  // 2. JSON context 로딩
  const context = await loadJsonContext(intent);

  // 3. Langchain Tool 호출 (예시)
  const toolResult = await runTools(intent, question, context);

  // 4. OpenAI GPT-4o-mini 답변
  const systemPrompt =
    `너는 고려대 교환학생 챗봇이다. 답변 언어는 질문 언어와 반드시 일치해야 한다.\n` +
    `아래 context와 tool 결과를 참고해 답변하라.\n` +
    `context: ${JSON.stringify(context)}\n` +
    `tool: ${JSON.stringify(toolResult)}`;

  const answer = await callOpenAI({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 512,
  });

  // 5. 대화 로그 저장 (익명 허용)
  let user_id: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    user_id = user?.id || null;
  } catch {}
  await supabase.from("chat_messages").insert({
    user_id,
    question,
    answer,
  });

  return NextResponse.json({ answer, intent, context, tool_used: toolResult });
}
