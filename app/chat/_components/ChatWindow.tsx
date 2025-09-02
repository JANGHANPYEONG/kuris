"use client";
import React, { useRef, useEffect } from "react";
import BotMessage from "./BotMessage";
import { ChatMessage, TextData, Block } from "./types";

export type { ChatMessage };

export default function ChatWindow({
  messages,
  abortSignal,
  isStreaming,
  onStreamingComplete,
  onContentUpdate,
}: {
  messages: ChatMessage[];
  abortSignal?: AbortSignal;
  isStreaming?: boolean;
  onStreamingComplete?: (blocks: Block[]) => void;
  onContentUpdate?: (blocks: Block[], currentText: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* 새 메시지마다 하단으로 스크롤 */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* 스트리밍 중일 때만 자동 스크롤 */
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100); // 100ms마다 체크

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <section className="flex flex-col gap-4 px-6 py-6 pb-24">
      {messages.map((msg, i) => (
        <div key={i} className="w-full">
          {msg.role === "user" ? (
            // User 메시지 - 말풍선 스타일 유지
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-xl px-4 py-2 shadow bg-kucrimson text-white">
                {typeof msg.content === "string"
                  ? msg.content
                  : "blocks" in msg.content
                  ? "사용자 메시지"
                  : "data" in msg.content
                  ? (msg.content.data as TextData).text
                  : "사용자 메시지"}
              </div>
            </div>
          ) : (
            // Bot 메시지 - 말풍선 없이 BotMessage 컴포넌트 사용
            <BotMessage
              content={msg.content}
              isTyping={
                msg.isTyping ||
                (i === messages.length - 1 &&
                  typeof msg.content === "object" &&
                  "stream" in msg.content)
              } // 스트리밍 중인 메시지만 타이핑 효과 적용
              abortSignal={abortSignal}
              onStreamingComplete={onStreamingComplete}
              onContentUpdate={onContentUpdate}
            />
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </section>
  );
}
