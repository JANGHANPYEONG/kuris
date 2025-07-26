"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabaseClient";

export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithAdminAuthComponent(props: P) {
    return <Component {...props} />;
  };
}
