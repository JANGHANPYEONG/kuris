"use client";
import React from "react";
import { useUpload } from "@/lib/uploadContext";

export default function UploadPopup() {
  const { state, removeUpload, setVisibility } = useUpload();

  if (!state.isVisible || state.uploads.length === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        );
      case "uploading":
        return (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        );
      case "completed":
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "대기중";
      case "uploading":
        return "업로드중";
      case "completed":
        return "완료";
      case "error":
        return "오류";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-gray-600";
      case "uploading":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 max-h-96 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">업로드 진행상황</h3>
          <button
            onClick={() => setVisibility(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* 업로드 리스트 */}
        <div className="max-h-64 overflow-y-auto">
          {state.uploads.map((upload) => (
            <div
              key={upload.id}
              className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start space-x-3">
                {/* 상태 아이콘 */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(upload.status)}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.title}
                    </p>
                    <button
                      onClick={() => removeUpload(upload.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`text-xs font-medium ${getStatusColor(
                        upload.status
                      )}`}
                    >
                      {getStatusText(upload.status)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(upload.createdAt).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* 오류 메시지 */}
                  {upload.status === "error" && upload.error && (
                    <p className="text-xs text-red-600 mt-1 truncate">
                      {upload.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 푸터 */}
        {state.uploads.length > 0 && (
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>총 {state.uploads.length}개 업로드</span>
              <span>
                {state.uploads.filter((u) => u.status === "completed").length}개
                완료
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
