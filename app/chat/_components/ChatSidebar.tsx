import React from "react";

interface Props {
  activeTab: string;
  setActiveTab: (tab: "chat" | "contacts" | "map") => void;
  onClose: () => void;
}

const ITEMS = [
  {
    key: "chat",
    label: "채팅",
    icon: (
      <svg
        width="25"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: "contacts",
    label: "임원진 연락처",
    icon: (
      <svg
        width="25"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "map",
    label: "네이버맵",
    icon: (
      <svg
        width="25"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-1.447-.894L15 4m0 13V4m-6 3l6-3" />
      </svg>
    ),
  },
] as const;

export default function ChatSidebar({
  activeTab,
  setActiveTab,
  onClose,
}: Props) {
  return (
    <aside className="relative flex flex-col w-64 h-full bg-white shadow-2xl">
      {/* 브랜드 / 닫기 */}
      <div className="h-16 flex items-center px-1 border-b border-gray-100">
        <img
          src="/kuris_logo.png"
          alt="KUris Logo"
          className="h-16 w-auto object-contain"
        />
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
          {ITEMS.map(({ key, label, icon }) => (
            <li key={key}>
              <button
                onClick={() => {
                  setActiveTab(key);
                }}
                className={`w-full text-left px-6 py-3 rounded-lg font-medium transition flex items-center space-x-3
                    ${
                      activeTab === key
                        ? "bg-kucrimson/10 text-kucrimson"
                        : "text-gray-700 hover:bg-kucrimson/5"
                    }`}
              >
                <span className="flex-shrink-0">{icon}</span>
                <span>{label}</span>
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
