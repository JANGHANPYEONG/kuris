import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // 미들웨어는 비활성화하고 API route에서 직접 인증 처리
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
