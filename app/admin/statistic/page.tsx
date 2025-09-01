"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ChatLog {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

interface StatisticData {
  totalChats: number;
  totalGuidelines: number;
  recentChats: ChatLog[];
}

export default function StatisticPage() {
  const [stats, setStats] = useState<StatisticData>({
    totalChats: 0,
    totalGuidelines: 0,
    recentChats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // 세션/권한 보호
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || user.user_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
      }
    });
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    setError("");
    try {
      // 채팅 로그 수 조회
      const { count: chatCount, error: chatError } = await supabase
        .from("chat_logs")
        .select("*", { count: "exact", head: true });

      if (chatError) throw chatError;

      // 지침 수 조회
      const { count: guidelineCount, error: guidelineError } = await supabase
        .from("guidelines")
        .select("*", { count: "exact", head: true });

      if (guidelineError) throw guidelineError;

      // 최근 채팅 로그 조회
      const { data: recentChats, error: recentChatsError } = await supabase
        .from("chat_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (recentChatsError) throw recentChatsError;

      setStats({
        totalChats: chatCount || 0,
        totalGuidelines: guidelineCount || 0,
        recentChats: recentChats || [],
      });
    } catch (e) {
      console.error("Fetch statistics error:", e);
      setError("통계를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">사용자 통계</h1>
      </div>

      <Link
        href="/admin"
        className="inline-block mb-6 text-blue-600 hover:text-blue-800"
      >
        ← 대시보드로 돌아가기
      </Link>

      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : error ? (
        <div className="text-red-600 py-8">{error}</div>
      ) : (
        <div className="space-y-6">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    총 채팅 수
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalChats.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    총 지침 수
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalGuidelines.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 최근 채팅 로그 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                최근 채팅 로그
              </h2>
            </div>
            <div className="overflow-hidden">
              {stats.recentChats.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  아직 채팅 로그가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {stats.recentChats.map((chat) => (
                    <div key={chat.id} className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-gray-600">
                          {new Date(chat.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            사용자:
                          </p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {chat.question}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            봇:
                          </p>
                          <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                            {chat.answer === "fallback_response" ? (
                              <span className="text-red-600 font-medium">
                                정보없음
                              </span>
                            ) : chat.answer === "streaming_response" ? (
                              <span className="text-green-600 font-medium">
                                대답성공
                              </span>
                            ) : (
                              chat.answer
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
