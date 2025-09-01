"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // 세션/권한 보호
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || user.user_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
      }
    });
  }, []);

  const dashboardItems = [
    {
      title: "새 지침 업로드",
      description: "새로운 지침을 업로드합니다",
      href: "/admin/upload",
      icon: "📤",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "지침 목록 확인",
      description: "업로드된 지침들을 확인하고 관리합니다",
      href: "/admin/guidelines",
      icon: "📋",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "사용자 통계 확인",
      description: "사용자 활동 통계를 확인합니다",
      href: "/admin/statistic",
      icon: "📊",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "운영진 연락처 관리",
      description: "운영진 연락처를 등록하고 관리합니다",
      href: "/admin/contact",
      icon: "👥",
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      title: "시스템 설정",
      description: "match_threshold 등 시스템 설정을 관리합니다",
      href: "/admin/settings",
      icon: "⚙️",
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
  ];

  return (
    <div className="w-full py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">관리자 대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {dashboardItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`${item.color} text-white rounded-lg p-6 transition-all duration-200 transform hover:scale-105 shadow-lg`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{item.icon}</div>
              <div>
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                <p className="text-blue-100">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
