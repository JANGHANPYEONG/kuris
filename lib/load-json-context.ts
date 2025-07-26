export async function loadJsonContext(
  intent: string
): Promise<Record<string, unknown>> {
  // TODO: 실제로 Supabase Storage에서 intent별 JSON 불러오기
  // 예시: kuris-json/{intent}/*.json
  return { summary: "context 예시", intent };
}
