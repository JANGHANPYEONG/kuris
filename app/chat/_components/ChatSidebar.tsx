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
        <div className="flex items-center justify-center space-x-2">
          <span>© Kuris 2025</span>
          <a
            href="https://github.com/JANGHANPYEONG/kuris"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="GitHub Repository"
          >
            <svg width="25" height="25" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </footer>
    </aside>
  );
}
