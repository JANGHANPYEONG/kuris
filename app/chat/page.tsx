"use client";
import { useState, useEffect } from "react";
import ChatSidebar from "./_components/ChatSidebar";
import ChatWindow, { ChatMessage } from "./_components/ChatWindow";
import ChatInput from "./_components/ChatInput";
import ContactList from "./_components/ContactList";
import NaverMapBox from "./_components/NaverMapBox";

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "contacts" | "map">(
    "chat"
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* 데모용 초기 메시지 */
  useEffect(() => {
    setMessages([
      { role: "bot", content: "안녕하세요! 무엇을 도와드릴까요?" },
      { role: "user", content: "학생증 발급 방법 알려줘" },
    ]);
  }, []);

  const handleSend = async (text: string) => {
    setMessages((msgs) => [...msgs, { role: "user", content: text }]);
    /* TODO: 실제 API 연동 */
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* ───── 사이드바 오버레이 ───── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:static md:inset-auto">
          <ChatSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* ───── 헤더 영역 ───── */}
      <header className="fixed top-0 left-0 right-0 z-0 flex items-center h-16 px-4 bg-gray-50">
        {/* 사이드바 열기 버튼 (헤더 안) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="사이드바 열기"
            className="mr-4 bg-white text-kucrimson rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 transition"
          >
            {/* 햄버거 아이콘 */}
            <svg width="24" height="24" stroke="#DC143C" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <span className="text-2xl font-bold text-black select-none">
          KUris-o1
        </span>
      </header>

      {/* ───── 메인 영역 ───── */}
      <main className="flex-1 flex flex-col items-center w-full overflow-x-hidden pt-10">
        <div className="w-full max-w-2xl flex flex-col flex-1">
          {activeTab === "chat" && (
            <>
              <ChatWindow messages={messages} />
              <ChatInput onSend={handleSend} sidebarOffset={sidebarOpen} />
            </>
          )}
          {activeTab === "contacts" && <ContactList />}
          {activeTab === "map" && <NaverMapBox />}
        </div>
      </main>
    </div>
  );
}
