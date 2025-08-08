// fallback-intent.ts: fallback intent 분류

// fallback intent 분류 함수
export async function fallbackIntentClassification(
  question: string
): Promise<{ id: string; name: string }> {
  // 임시로 기본값 반환 (나중에 사용자가 구현할 예정)
  return {
    id: "fallback-intent-id",
    name: "life/food",
  };
}
