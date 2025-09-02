"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useAdminData } from "@/lib/adminDataContext";

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
  const { state, fetchStatistics } = useAdminData();

  useEffect(() => {
    // 인증은 admin/layout.tsx에서 처리되므로 여기서는 제거
    // 캐시된 데이터가 있으면 사용, 없으면 새로 fetch
    if (
      state.statistics.totalChats === 0 &&
      state.statistics.totalGuidelines === 0
    ) {
      fetchStatistics();
    }
  }, [
    fetchStatistics,
    state.statistics.totalChats,
    state.statistics.totalGuidelines,
  ]);

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

      {state.loading.statistics ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : state.errors.statistics ? (
        <div className="text-red-600 py-8">{state.errors.statistics}</div>
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
                    {state.statistics.totalChats.toLocaleString()}
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
                    {state.statistics.totalGuidelines.toLocaleString()}
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
              {state.statistics.recentChats.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  아직 채팅 로그가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {state.statistics.recentChats.map((chat) => (
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
