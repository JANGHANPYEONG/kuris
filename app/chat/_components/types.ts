// 채팅 메시지 타입 정의
export interface ChatMessage {
  role: "user" | "bot";
  content: string | BotContent;
}

export interface BotContent {
  type: "text" | "image" | "map" | "link" | "loading";
  data: TextData | ImageData | MapData | LinkData | LoadingData;
}

// 각 콘텐츠 타입별 데이터 인터페이스
export interface TextData {
  text: string;
}

export interface ImageData {
  url: string;
  alt?: string;
  caption?: string;
}

export interface MapData {
  location: string;
  coordinates?: { lat: number; lng: number };
}

export interface LinkData {
  url: string;
  title: string;
  description?: string;
}

export interface LoadingData {
  message?: string;
}
