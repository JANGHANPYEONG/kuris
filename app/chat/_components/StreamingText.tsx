"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { Block } from "./types";

interface StreamingTextProps {
  stream?: ReadableStream<Uint8Array>;
  blocks?: Block[];
  onComplete?: () => void;
  onError?: (error: unknown) => void;
  onBlock?: (block: Block) => void;
  typingDelayMs?: number;
  className?: string;
}

// 1) 스트림 unlock 대기 (StrictMode/핫리로드 중복 호출 완화)
function waitForUnlock(
  s: ReadableStream,
  signal?: AbortSignal,
  timeoutMs = 2000
) {
  return new Promise<boolean>((resolve) => {
    if (!s.locked) return resolve(true);
    const started = Date.now();
    const tick = () => {
      if (signal?.aborted) return resolve(false);
      if (!s.locked) return resolve(true);
      if (Date.now() - started > timeoutMs) return resolve(false);
      setTimeout(tick, 16);
    };
    tick();
  });
}

// 2) NDJSON 파서(Abort 안전, 락 대기 포함)
async function* ndjsonIterator(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal
) {
  console.log("🔓 NDJSON 파서 시작 - 스트림 락 상태:", stream.locked);

  const ok = await waitForUnlock(stream, signal);
  if (!ok || signal?.aborted) {
    console.log("❌ 스트림 락 해제 실패 또는 Abort됨");
    throw new DOMException("aborted", "AbortError");
  }

  console.log("✅ 스트림 락 해제 완료, 리더 시작");

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let blockCount = 0;

  try {
    while (true) {
      if (signal?.aborted) {
        console.log("🛑 Abort 신호 수신, 스트림 읽기 중단");
        try {
          await reader.cancel("aborted");
        } catch {}
        break;
      }

      const { value, done } = await reader.read();
      if (done) {
        console.log("📡 스트림 완료, 총 블록 수:", blockCount);
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        let line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);

        if (!line) continue;

        // (서버는 NDJSON이지만, 혹시 data: 접두가 섞여도 방어적으로 제거)
        if (line.startsWith("data:")) line = line.slice(5).trim();

        try {
          const block = JSON.parse(line);
          blockCount++;
          console.log(`📦 블록 ${blockCount} 파싱 성공:`, block.type);
          yield block;
        } catch (e) {
          console.warn("⚠️ 불완전 라인 스킵:", line.substring(0, 50));
        }
      }
    }

    // 꼬리 처리(있으면만)
    const tail = buffer.trim();
    if (tail) {
      const t = tail.startsWith("data:") ? tail.slice(5).trim() : tail;
      try {
        const block = JSON.parse(t);
        blockCount++;
        console.log(`📦 꼬리 블록 ${blockCount} 파싱 성공:`, block.type);
        yield block;
      } catch {}
    }
  } finally {
    try {
      reader.releaseLock();
      console.log("🔓 리더 락 해제 완료");
    } catch {}
  }
}

// ReactMarkdown 컴포넌트 맵
const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xl font-bold mb-3 text-gray-900">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-lg font-bold mb-2 text-gray-900">{children}</h3>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="text-base font-bold mb-2 text-gray-900">{children}</h4>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-gray-700">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold text-gray-900">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-gray-700">{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-3">
      <code className="text-sm font-mono text-gray-800">{children}</code>
    </pre>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-3">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      className="text-blue-600 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

const StreamingText: React.FC<StreamingTextProps> = ({
  stream,
  blocks,
  onComplete,
  onError,
  onBlock,
  typingDelayMs = 20,
  className = "",
}) => {
  // 상태
  const [blocksQueue, setBlocksQueue] = useState<Block[]>([]);
  const [displayedBlocks, setDisplayedBlocks] = useState<Block[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [doneReading, setDoneReading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // refs
  const streamRef = useRef<ReadableStream<Uint8Array> | null>(null);
  const readingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 블록 렌더링 함수
  const renderBlock = useCallback((block: Block, index: number) => {
    switch (block.type) {
      case "text":
        if (!block.text) {
          console.warn("⚠️ text 블록에 text가 없음:", block);
          return null;
        }
        return (
          <div key={index} className="mb-4">
            <ReactMarkdown components={markdownComponents}>
              {block.text}
            </ReactMarkdown>
          </div>
        );

      case "link":
        return (
          <div
            key={index}
            className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <h4 className="text-lg font-semibold text-blue-900 mb-2">
              {block.title || "링크"}
            </h4>
            {block.description && (
              <p className="text-sm text-gray-600 mb-3">{block.description}</p>
            )}
            <a
              href={block.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              링크 열기
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        );

      case "image":
        return (
          <div
            key={index}
            className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {block.title || "이미지"}
            </h4>
            {block.description && (
              <p className="text-sm text-gray-600 mb-3">{block.description}</p>
            )}
            <img
              src={block.url}
              alt={block.title || "이미지"}
              className="w-full h-auto rounded-lg"
            />
          </div>
        );

      case "map":
        return (
          <div
            key={index}
            className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {block.title || "지도"}
            </h4>
            {block.description && (
              <p className="text-sm text-gray-600 mb-3">{block.description}</p>
            )}
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">지도 컴포넌트</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, []);

  // 스트림 읽기 함수
  const readStream = useCallback(
    async (s: ReadableStream<Uint8Array>, signal: AbortSignal) => {
      if (readingRef.current) return;

      readingRef.current = true;
      streamRef.current = s;

      try {
        for await (const block of ndjsonIterator(s, signal)) {
          if (signal.aborted) break;
          onBlock?.(block);
          setBlocksQueue((prev) => [...prev, block]);
        }
      } catch (error) {
        console.error("Streaming error:", error);
        onError?.(error);
      } finally {
        readingRef.current = false;
        setDoneReading(true);
      }
    },
    [onBlock, onError]
  );

  // 큐 처리 및 타이핑
  useEffect(() => {
    if (isTyping || blocksQueue.length === 0) return;

    const [next, ...rest] = blocksQueue;
    setBlocksQueue(rest);

    if (next.type === "text" && next.text) {
      setIsTyping(true);
      setCurrentText("");

      (async () => {
        const delay = typingDelayMs;
        for (let i = 1; i <= next.text!.length; i++) {
          if (abortControllerRef.current?.signal.aborted) break;

          setCurrentText(next.text!.substring(0, i));
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        if (!abortControllerRef.current?.signal.aborted) {
          setDisplayedBlocks((prev) => [...prev, next]);
          setCurrentText("");
          setIsTyping(false);
        }
      })();
    } else {
      setDisplayedBlocks((prev) => [...prev, next]);
    }
  }, [blocksQueue, isTyping, typingDelayMs]);

  // 완료 상태 처리
  useEffect(() => {
    if (doneReading && !isTyping && blocksQueue.length === 0) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [doneReading, isTyping, blocksQueue.length, onComplete]);

  // 스트림 처리
  useEffect(() => {
    if (!stream) return;

    // 이전 스트림 중단
    abortControllerRef.current?.abort();
    const ac = new AbortController();
    abortControllerRef.current = ac;

    (async () => {
      // 다음 틱에 시작 → StrictMode cleanup 먼저 실행되도록
      await Promise.resolve();
      if (ac.signal.aborted) return;
      await readStream(stream, ac.signal);
    })();

    return () => {
      ac.abort();
      readingRef.current = false;
    };
  }, [stream, readStream]);

  // 초기 블록 처리
  useEffect(() => {
    if (blocks && blocks.length > 0) {
      setBlocksQueue(blocks);
    }
  }, [blocks]);

  // 현재 타이핑 중인 텍스트 렌더링
  const renderTypingText = () => {
    if (!isTyping || !currentText) return null;

    return (
      <div className="w-full">
        <ReactMarkdown components={markdownComponents}>
          {currentText}
        </ReactMarkdown>
        <span className="inline-block w-2 h-5 bg-gray-900 ml-1 animate-pulse" />
      </div>
    );
  };

  return (
    <div className={className}>
      {/* 완성된 블록들 */}
      {displayedBlocks.map((block, index) => renderBlock(block, index))}

      {/* 현재 타이핑 중인 텍스트 */}
      {renderTypingText()}

      {/* 타이핑 커서 (완료되지 않았을 때만) */}
      {!isComplete && !isTyping && blocksQueue.length === 0 && (
        <span className="inline-block w-2 h-5 bg-gray-900 animate-pulse" />
      )}
    </div>
  );
};

export default StreamingText;
