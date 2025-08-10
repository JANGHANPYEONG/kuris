"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (
      pathname.startsWith("/admin/login") ||
      pathname.startsWith("/admin/signup")
    ) {
      setChecking(false);
      return;
    }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/admin/login");
      } else if (user.user_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
      } else {
        setChecking(false);
      }
    });
  }, [router, pathname]);

  if (checking) {
    return <LoadingSpinner text="로그인 상태 확인 중..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <header className="bg-gray-900 text-white px-6 py-4 font-bold text-xl flex items-center justify-between">
        <span>KUris Admin</span>
        <nav className="space-x-4 text-base font-normal">
          <Link href="/admin" className="hover:underline">
            홈
          </Link>
          <Link href="/admin/upload" className="hover:underline">
            지침 업로드
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/admin/login");
            }}
            className="ml-4 text-sm underline"
          >
            로그아웃
          </button>
        </nav>
      </header>
      <main className="max-w-3xl mx-auto py-8 text-black">{children}</main>
    </div>
  );
}
