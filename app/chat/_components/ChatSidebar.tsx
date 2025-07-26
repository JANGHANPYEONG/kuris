import React from "react";

interface Props {
  activeTab: string;
  setActiveTab: (tab: "chat" | "contacts" | "map") => void;
  onClose: () => void;
}

const ITEMS = [
  { key: "chat", label: "채팅" },
  { key: "contacts", label: "임원진 연락처" },
  { key: "map", label: "네이버맵" },
] as const;

export default function ChatSidebar({
  activeTab,
  setActiveTab,
  onClose,
}: Props) {
  return (
    <aside className="relative flex flex-col w-64 h-full bg-white border-r shadow-lg">
      {/* 브랜드 / 닫기 */}
      <div className="h-16 flex items-center justify-center border-b font-extrabold text-2xl text-kucrimson">
        KUris
      </div>

      {/* 왼쪽 화살표(닫기) – 모바일에서만 보이도록 */}
      <button
        onClick={onClose}
        aria-label="사이드바 닫기"
        className="absolute top-4 right-4 text-gray-600 hover:text-kucrimson transition"
      >
        {/* ← 아이콘 */}
        <svg
          width="22"
          height="22"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        >
          <polyline points="15 18 9 12 15 6" />
          <line x1="9" y1="12" x2="21" y2="12" />
        </svg>
      </button>

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {ITEMS.map(({ key, label }) => (
            <li key={key}>
              <button
                onClick={() => {
                  setActiveTab(key);
                  onClose(); /* 모바일 UX 개선 */
                }}
                className={`w-full text-left px-6 py-3 rounded-lg font-medium transition
                    ${
                      activeTab === key
                        ? "bg-kucrimson/10 text-kucrimson"
                        : "text-gray-700 hover:bg-kucrimson/5"
                    }`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <footer className="p-4 text-xs text-gray-400 border-t text-center">
        © KUris 2025
      </footer>
    </aside>
  );
}
