// Supabase Edge Function: verifyAdminCode
// 입력: { code: string }
// 검증: ADMIN_INVITE_CODE (Project Secret)
// 결과: { valid: boolean }

import { serve } from "https://deno.land/std@0.181.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  let code: string | undefined;
  try {
    const body = await req.json();
    code = body.code;
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  if (!code) {
    return new Response("Missing code", { status: 400, headers: corsHeaders });
  }

  const secret = Deno.env.get("ADMIN_INVITE_CODE");
  if (!secret) {
    return new Response("Server misconfig: missing secret", {
      status: 500,
      headers: corsHeaders,
    });
  }

  const valid = code === secret;
  return new Response(JSON.stringify({ valid }), {
    headers: corsHeaders,
    status: 200,
  });
});
