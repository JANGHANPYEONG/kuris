// TypingText.tsx: 타이핑 효과 컴포넌트

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface TypingTextProps {
  text: string;
  speed?: number; // ms per character
  onComplete?: () => void;
  className?: string;
}

const TypingText: React.FC<TypingTextProps> = ({
  text,
  speed = 30,
  onComplete,
  className = "",
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // 텍스트가 변경되면 타이핑 효과 재시작
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

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
      {currentIndex < text.length && <span className="animate-pulse">|</span>}
    </div>
  );
};

export default TypingText;
