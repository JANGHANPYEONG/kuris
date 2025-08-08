import React from "react";
import { useLanguage } from "./LanguageContext";
import { t } from "./translations";

interface Props {
  activeTab: string;
  setActiveTab: (tab: "chat" | "contacts") => void;
  onClose: () => void;
}

export default function ChatSidebar({
  activeTab,
  setActiveTab,
  onClose,
}: Props) {
  const { language } = useLanguage();

  const ITEMS = [
    {
      key: "chat",
      label: t(language, "chat"),
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
      label: t(language, "contacts"),
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
  ] as const;
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
        {t(language, "footer")}
      </footer>
    </aside>
  );
}
