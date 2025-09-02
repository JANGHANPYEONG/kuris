"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminData } from "@/lib/adminDataContext";

export default function SettingsPage() {
  const { state, fetchSettings, updateSettings } = useAdminData();
  const [matchThreshold, setMatchThreshold] = useState("0.28");
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 세션/권한 보호
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || user.user_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
      }
    });
    // 캐시된 데이터가 있으면 사용, 없으면 새로 fetch (대시보드에서 미리 로드했지만 혹시 모를 경우를 대비)
    if (
      state.settings.match_threshold === "0.28" &&
      state.lastUpdated.settings === null
    ) {
      fetchSettings();
    }
  }, [
    fetchSettings,
    state.settings.match_threshold,
    state.lastUpdated.settings,
    router,
  ]);

  // 설정이 로드되면 로컬 상태 업데이트
  useEffect(() => {
    if (state.settings.match_threshold) {
      setMatchThreshold(state.settings.match_threshold);
    }
  }, [state.settings.match_threshold]);

  const handleUpdateMatchThreshold = async () => {
    setUpdating(true);
    try {
      await updateSettings({ match_threshold: matchThreshold });
      alert("설정이 업데이트되었습니다!");
    } catch (e) {
      console.error("Update setting error:", e);
      alert(
        `설정 업데이트 중 오류가 발생했습니다: ${
          e instanceof Error ? e.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="w-full py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">시스템 설정</h1>
      </div>

      <Link
        href="/admin"
        className="inline-block mb-6 text-blue-600 hover:text-blue-800"
      >
        ← 대시보드로 돌아가기
      </Link>

      {state.loading.settings ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">설정을 불러오는 중...</p>
        </div>
      ) : state.errors.settings ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-red-800 font-medium text-lg mb-2">오류 발생</div>
          <div className="text-red-600 mb-4">{state.errors.settings}</div>
          <button
            onClick={() => fetchSettings(true)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="w-full max-w-none">
          {/* Match Threshold 설정 */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Match Threshold
                </h2>
                <p className="text-gray-600">벡터 유사도 매칭 임계값</p>
              </div>
            </div>

            {/* 설명 섹션 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                📖 Match Threshold란?
              </h3>
              <div className="space-y-3 text-blue-800">
                <p>
                  <strong>Match Threshold</strong>는 사용자 질문과 지침 간의
                  유사도를 판단하는 기준값입니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      🔽 낮은 값 (0.1 ~ 0.3)
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• 더 많은 관련 지침을 찾음</li>
                      <li>• 정확도는 낮을 수 있음</li>
                      <li>• &quot;정보없음&quot; 응답이 줄어듦</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      🔼 높은 값 (0.7 ~ 0.9)
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• 매우 유사한 지침만 찾음</li>
                      <li>• 정확도가 높음</li>
                      <li>• &quot;정보없음&quot; 응답이 늘어남</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm bg-blue-100 p-3 rounded">
                  💡 <strong>권장값:</strong> 0.3 ~ 0.7 사이에서 조정해보세요.
                  너무 많은 &quot;정보없음&quot; 응답이 나온다면 값을 낮추고,
                  부정확한 답변이 많다면 값을 높여보세요.
                </p>
              </div>
            </div>

            {/* 설정 입력 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label
                    htmlFor="matchThreshold"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    현재 값:{" "}
                    <span className="font-bold text-blue-600">
                      {matchThreshold}
                    </span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      id="matchThreshold"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={matchThreshold}
                      onChange={(e) => setMatchThreshold(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg w-32"
                      placeholder="0.28"
                    />
                    <button
                      onClick={handleUpdateMatchThreshold}
                      disabled={updating}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {updating ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          업데이트 중...
                        </span>
                      ) : (
                        "설정 저장"
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    값 범위: 0.0 ~ 1.0 (소수점 첫째 자리까지 입력 가능)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="text-yellow-600 mr-3 mt-1">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  💡 설정 변경 팁
                </h3>
                <ul className="text-yellow-800 space-y-1 text-sm">
                  <li>• 설정 변경 후 즉시 적용됩니다</li>
                  <li>• 변경사항을 확인하려면 채팅에서 질문을 해보세요</li>
                  <li>• 너무 극단적인 값은 피하는 것이 좋습니다</li>
                  <li>• 사용자 피드백을 바탕으로 점진적으로 조정하세요</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
