"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ChatMessage, Block } from "./types";

interface ChatContextType {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (updater: (msg: ChatMessage) => ChatMessage) => void;
  clearMessages: () => void;
  addStreamingCache: (blocks: Block[]) => void;
  getStreamingCache: () => Block[];
  clearStreamingCache: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingCache, setStreamingCache] = useState<Block[]>([]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateLastMessage = useCallback(
    (updater: (msg: ChatMessage) => ChatMessage) => {
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = updater(newMessages[lastIndex]);
        return newMessages;
      });
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingCache([]);
  }, []);

  const addStreamingCache = useCallback((blocks: Block[]) => {
    setStreamingCache(blocks);
  }, []);

  const getStreamingCache = useCallback(() => {
    return streamingCache;
  }, [streamingCache]);

  const clearStreamingCache = useCallback(() => {
    setStreamingCache([]);
  }, []);

  const value: ChatContextType = {
    messages,
    addMessage,
    updateLastMessage,
    clearMessages,
    addStreamingCache,
    getStreamingCache,
    clearStreamingCache,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

