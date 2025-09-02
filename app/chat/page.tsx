"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import ChatSidebar from "./_components/ChatSidebar";
import ChatWindow from "./_components/ChatWindow";
import { ChatMessage, Block } from "./_components/types";
import ChatInput from "./_components/ChatInput";
import ContactList from "./_components/ContactList";

import { LanguageProvider } from "./_components/LanguageContext";
import { useLanguage } from "./_components/LanguageContext";
import { t } from "./_components/translations";
import { ContactProvider } from "./_components/ContactContext";
import { ChatProvider, useChat } from "./_components/ChatContext";

function ChatPageContent() {
  const [activeTab, setActiveTab] = useState<"chat" | "contacts">("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const { language } = useLanguage();
  const { messages, addMessage, updateLastMessage, addStreamingCache } =
    useChat();

  const handleSend = async (text: string) => {
    addMessage({ role: "user", content: text });

    // 로딩 상태 추가
    addMessage({
      role: "bot",
      content: {
        type: "loading",
        data: { message: t(language, "loading") },
      },
    });

    // 스트리밍 상태 설정
    setIsStreaming(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // 스트리밍 API 호출
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson", // NDJSON 응답 요청
        },
        body: JSON.stringify({ question: text, language, stream: true }),
        cache: "no-store", // 캐시 방지
        signal: controller.signal, // AbortSignal 추가
      });

      if (!response.ok) {
        let errorMessage = "API 호출 실패";
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch (jsonError) {
          // JSON 파싱 실패 시 응답 텍스트를 확인
          const responseText = await response.text();
          console.error("API 응답이 JSON이 아닙니다:", responseText);
          console.error("응답 상태:", response.status, response.statusText);
          console.error(
            "응답 헤더:",
            Object.fromEntries(response.headers.entries())
          );

          // HTML 에러 페이지인지 확인
          if (
            responseText.includes("<!DOCTYPE") ||
            responseText.includes("<html")
          ) {
            errorMessage = `서버 오류 (${response.status}): API 엔드포인트가 응답하지 않습니다. 환경 변수를 확인해주세요.`;
          } else {
            errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      // 스트리밍 응답인 경우
      if (response.body) {
        // 로딩 메시지를 스트리밍 메시지로 교체
        updateLastMessage((msg) => {
          if (
            msg.role === "bot" &&
            typeof msg.content !== "string" &&
            "type" in msg.content &&
            msg.content.type === "loading"
          ) {
            return {
              role: "bot",
              content: {
                stream: response.body!,
                onComplete: () => {
                  setIsStreaming(false);
                  setAbortController(null);
                },
              },
            };
          }
          return msg;
        });
      } else {
        // 일반 JSON 응답인 경우 (fallback)
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error("JSON 파싱 실패:", jsonError);
          throw new Error("서버에서 유효하지 않은 응답을 받았습니다.");
        }

        // 로딩 메시지를 실제 답변으로 교체
        updateLastMessage((msg) => {
          if (
            msg.role === "bot" &&
            typeof msg.content !== "string" &&
            "type" in msg.content &&
            msg.content.type === "loading"
          ) {
            // 새로운 blocks JSON 형식 처리
            if (result.blocks) {
              return {
                role: "bot",
                content: {
                  blocks: result.blocks,
                  intent: result.intent,
                },
              };
            } else {
              // 기존 형식 호환성 유지
              return {
                role: "bot",
                content: {
                  type: "text",
                  data: { text: result.answer || "답변을 생성할 수 없습니다." },
                },
              };
            }
          }
          return msg;
        });
      }
    } catch (error) {
      console.error("Chat API error:", error);

      // 에러 발생 시에만 스트리밍 상태 해제
      setIsStreaming(false);
      setAbortController(null);

      // 에러 메시지로 교체
      updateLastMessage((msg) => {
        if (
          msg.role === "bot" &&
          typeof msg.content !== "string" &&
          "type" in msg.content &&
          (msg.content as { type: string }).type === "loading"
        ) {
          return {
            role: "bot",
            content: {
              type: "text",
              data: {
                text: `${t(language, "error")} ${
                  error instanceof Error ? error.message : "알 수 없는 오류"
                }`,
              },
            },
          };
        }
        return msg;
      });
    }
  };

  const handleStopStreaming = () => {
    console.log("중지 버튼 클릭됨");
    if (abortController) {
      console.log("AbortController 존재, 중단 실행");
      abortController.abort();
      setIsStreaming(false);
      setAbortController(null);

      // 로딩 메시지만 중단 메시지로 교체 (스트리밍 메시지는 StreamingText에서 처리)
      updateLastMessage((msg) => {
        if (
          msg.role === "bot" &&
          typeof msg.content !== "string" &&
          "type" in msg.content
        ) {
          const content = msg.content as { type: string };
          // 로딩 메시지만 중단 메시지로 교체
          if (content.type === "loading") {
            return {
              role: "bot",
              content: {
                type: "text",
                data: {
                  text: "응답이 중단되었습니다.",
                },
              },
            };
          }
          // 스트리밍 메시지는 StreamingText 컴포넌트에서 현재 내용을 보존하도록 함
        }
        return msg;
      });
    } else {
      console.log("AbortController가 없음");
    }
  };

  const handleStreamingComplete = (blocks: Block[]) => {
    // 스트리밍 완료 시 스트리밍 메시지를 blocks 메시지로 변환
    updateLastMessage((msg) => {
      if (
        msg.role === "bot" &&
        typeof msg.content === "object" &&
        "stream" in msg.content
      ) {
        return {
          role: "bot",
          content: {
            blocks: blocks,
            intent: "streaming-completed",
          },
        };
      }
      return msg;
    });
  };

  const handleContentUpdate = (blocks: Block[], currentText: string) => {
    // 실시간으로 스트리밍 내용을 캐시 메시지로 저장
    const tempBlocks = [...blocks];
    if (currentText) {
      tempBlocks.push({ type: "text", text: currentText });
    }
    addStreamingCache(tempBlocks);
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
              {messages.length === 0 ? (
                // 초기 화면 - ChatGPT 스타일
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-4">
                      <Image
                        src="/kuris-real.png"
                        alt="KUris 캐릭터"
                        width={320}
                        height={320}
                        className="object-contain"
                      />
                      <p className="text-gray-600 text-xl hidden md:block">
                        {t(language, "welcome")}
                      </p>
                    </div>
                  </div>

                  {/* 중앙에 위치한 입력창 */}
                  <div className="w-full max-w-3xl">
                    <ChatInput
                      onSend={handleSend}
                      sidebarOffset={sidebarOpen}
                      isCentered={true}
                      isStreaming={isStreaming}
                      onStopStreaming={handleStopStreaming}
                    />
                  </div>
                </div>
              ) : (
                // 일반 채팅 화면
                <>
                  <ChatWindow
                    messages={messages}
                    abortSignal={abortController?.signal}
                    isStreaming={isStreaming}
                    onStreamingComplete={handleStreamingComplete}
                    onContentUpdate={handleContentUpdate}
                  />
                  <ChatInput
                    onSend={handleSend}
                    sidebarOffset={sidebarOpen}
                    isCentered={false}
                    isStreaming={isStreaming}
                    onStopStreaming={handleStopStreaming}
                  />
                </>
              )}
            </>
          )}
          {activeTab === "contacts" && <ContactList />}
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <LanguageProvider>
      <ContactProvider>
        <ChatProvider>
          <ChatPageContent />
        </ChatProvider>
      </ContactProvider>
    </LanguageProvider>
  );
}
