// StreamingText.tsx: 실시간 스트리밍 텍스트 컴포넌트

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface StreamingTextProps {
  stream: ReadableStream<Uint8Array>;
  onComplete?: () => void;
  className?: string;
}

const StreamingText: React.FC<StreamingTextProps> = ({
  stream,
  onComplete,
  className = "",
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const isReadingRef = useRef(false);

  useEffect(() => {
    // 이미 읽고 있는 경우 중복 실행 방지
    if (isReadingRef.current) {
      return;
    }

    isReadingRef.current = true;

    const readStream = async () => {
      try {
        // 스트림이 잠겨있는지 확인
        if (stream.locked) {
          console.warn("Stream is locked, cannot read");
          setIsComplete(true);
          return;
        }

        const reader = stream.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setIsComplete(true);
            if (onComplete) onComplete();
            break;
          }

          // 바이트 데이터를 텍스트로 디코딩
          const chunk = decoder.decode(value, { stream: true });
          setDisplayedText((prev) => prev + chunk);
        }

        reader.releaseLock();
      } catch (error) {
        console.error("Streaming error:", error);
        setIsComplete(true);
      } finally {
        isReadingRef.current = false;
      }
    };

    readStream();

    // 클린업 함수
    return () => {
      isReadingRef.current = false;
    };
  }, [stream, onComplete]);

  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          // 굵은 글씨 스타일링
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900">{children}</strong>
          ),
          // 제목 스타일링
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-2 text-gray-900">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mb-2 text-gray-900">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold mb-1 text-gray-900">
              {children}
            </h3>
          ),
          // 리스트 스타일링
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1 text-gray-900">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-900">
              {children}
            </ol>
          ),
          // 문단 스타일링
          p: ({ children }) => <p className="mb-2 text-gray-900">{children}</p>,
          // 링크 스타일링
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {!isComplete && <span className="animate-pulse">|</span>}
    </div>
  );
};

export default StreamingText;
