export async function classifyIntent(
  question: string,
  lang?: "ko" | "en"
): Promise<string> {
  // TODO: Langchain/AI 기반 intent 분류로 교체
  if (question.includes("학생증")) return "student_card";
  if (question.includes("기숙사")) return "dormitory";
  return "general";
}
