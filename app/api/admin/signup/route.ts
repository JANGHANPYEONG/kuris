import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { email, password, inviteCode } = await req.json();
  if (!email || !password || !inviteCode) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 1. EdgeFn으로 inviteCode 검증
  const edgeUrl =
    process.env.NEXT_PUBLIC_SUPABASE_EDGE_URL ||
    "https://rdcnivvbjzoyybdjedho.supabase.co/functions/v1";
  const verifyRes = await fetch(`${edgeUrl}/verifyAdminCode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: inviteCode }),
  });
  if (!verifyRes.ok) {
    return NextResponse.json({ error: "EdgeFn error" }, { status: 500 });
  }
  const { valid } = await verifyRes.json();
  if (!valid) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 401 });
  }

  // 2. Supabase signUp (role=admin)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "admin" },
    },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user });
}
