import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // next‑auth: JWT 또는 DB 세션 토큰
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = Boolean(token);

  // express‑session 쿠키만 쓸 거면 ↓ 한 줄로 대체
  // const isLoggedIn = Boolean(req.cookies.get('connect.sid'));

  const { pathname } = req.nextUrl;

  // (비로그인 && /main 이하) ➜ /login
  if (!isLoggedIn && pathname.startsWith("/main")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // (로그인 && /login) ➜ /main
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/main", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/main/:path*", "/login"],
};
