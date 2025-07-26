export async function runTools(
  intent: string,
  question: string,
  context: Record<string, unknown>
): Promise<{ tool: string; result: unknown }> {
  // TODO: Langchain Tool 연동
  return { tool: "none", result: null };
}
