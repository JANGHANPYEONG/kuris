import React, { useState, useRef, useEffect } from "react";
import { LANGUAGES, t } from "./translations";
import { useLanguage } from "./LanguageContext";

interface ChatInputProps {
  onSend: (text: string) => void;
  sidebarOffset?: boolean;
  isCentered?: boolean;
}

export default function ChatInput({
  onSend,
  sidebarOffset = false,
  isCentered = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const { language, setLanguage } = useLanguage();
  const [showLang, setShowLang] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [value]);

  // Close dropdown on outside click or ESC
  useEffect(() => {
    if (!showLang) return;
    const handle = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof MouseEvent &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowLang(false);
      }
      if (e instanceof KeyboardEvent && e.key === "Escape") {
        setShowLang(false);
      }
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [showLang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSend(value.trim());
      setValue("");
    }
  };

  return (
    <form
      className={`${
        isCentered
          ? "relative w-full"
          : `fixed bottom-4 right-5 ${
              sidebarOffset ? "md:left-64" : "left-5"
            } z-40 flex justify-center pointer-events-none`
      }`}
      onSubmit={handleSubmit}
    >
      <div
        className={`
        flex items-end w-full max-w-2xl
        bg-white/40
        backdrop-blur-md
        border border-white/30
        shadow-2xl
        rounded-2xl
        px-4 py-3 gap-2
        pointer-events-auto
        transition
        ring-1 ring-black/5
        ${isCentered ? "bg-white border-gray-200 shadow-lg" : ""}
      `}
      >
        {/* Language button */}
        <div className="relative flex items-end">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500 focus:outline-none"
            onClick={() => setShowLang((v) => !v)}
            aria-label="언어 설정"
          >
            <span className="text-xl">🌐</span>
          </button>
          {showLang && (
            <div
              ref={dropdownRef}
              className="absolute left-0 bottom-12 w-28 bg-white border rounded shadow z-50 overflow-visible"
            >
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    language === l.code
                      ? "font-bold text-kucrimson"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    setLanguage(l.code);
                    setShowLang(false);
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={t(language, "placeholder")}
          className="flex-1 min-h-12 max-h-40 resize-none bg-transparent px-2 py-2 focus:outline-none text-base"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as React.FormEvent);
            }
          }}
        />
        {/* Send button */}
        <button
          type="submit"
          className="bg-kucrimson text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg hover:bg-kucrimson/90 transition"
          aria-label="전송"
        >
          <svg
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </form>
  );
}
