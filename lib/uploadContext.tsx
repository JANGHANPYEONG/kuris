"use client";
import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
} from "react";

// 업로드 상태 타입
export type UploadStatus = "pending" | "uploading" | "completed" | "error";

// 업로드 아이템 타입
export interface UploadItem {
  id: string;
  title: string; // 상세 내용의 앞 10글자 + ...
  status: UploadStatus;
  error?: string;
  createdAt: number;
}

// 상태 타입
interface UploadState {
  uploads: UploadItem[];
  isVisible: boolean;
}

// 액션 타입
type UploadAction =
  | { type: "ADD_UPLOAD"; payload: UploadItem }
  | {
      type: "UPDATE_UPLOAD_STATUS";
      payload: { id: string; status: UploadStatus; error?: string };
    }
  | { type: "REMOVE_UPLOAD"; payload: string }
  | { type: "CLEAR_ALL_UPLOADS" }
  | { type: "SET_VISIBILITY"; payload: boolean };

// 초기 상태
const initialState: UploadState = {
  uploads: [],
  isVisible: false,
};

// 리듀서
function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case "ADD_UPLOAD":
      return {
        ...state,
        uploads: [...state.uploads, action.payload],
        isVisible: true,
      };
    case "UPDATE_UPLOAD_STATUS":
      return {
        ...state,
        uploads: state.uploads.map((upload) =>
          upload.id === action.payload.id
            ? {
                ...upload,
                status: action.payload.status,
                error: action.payload.error,
              }
            : upload
        ),
      };
    case "REMOVE_UPLOAD":
      const newUploads = state.uploads.filter(
        (upload) => upload.id !== action.payload
      );
      return {
        ...state,
        uploads: newUploads,
        isVisible: newUploads.length > 0,
      };
    case "CLEAR_ALL_UPLOADS":
      return {
        ...state,
        uploads: [],
        isVisible: false,
      };
    case "SET_VISIBILITY":
      return {
        ...state,
        isVisible: action.payload,
      };
    default:
      return state;
  }
}

// Context 생성
const UploadContext = createContext<{
  state: UploadState;
  dispatch: React.Dispatch<UploadAction>;
  addUpload: (title: string) => string;
  updateUploadStatus: (
    id: string,
    status: UploadStatus,
    error?: string
  ) => void;
  removeUpload: (id: string) => void;
  clearAllUploads: () => void;
  setVisibility: (visible: boolean) => void;
} | null>(null);

// Provider 컴포넌트
export function UploadProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uploadReducer, initialState);

  // 업로드 추가
  const addUpload = useCallback((title: string): string => {
    const id = `upload_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const uploadItem: UploadItem = {
      id,
      title,
      status: "pending",
      createdAt: Date.now(),
    };
    dispatch({ type: "ADD_UPLOAD", payload: uploadItem });
    return id;
  }, []);

  // 업로드 상태 업데이트
  const updateUploadStatus = useCallback(
    (id: string, status: UploadStatus, error?: string) => {
      dispatch({
        type: "UPDATE_UPLOAD_STATUS",
        payload: { id, status, error },
      });
    },
    []
  );

  // 업로드 제거
  const removeUpload = useCallback((id: string) => {
    dispatch({ type: "REMOVE_UPLOAD", payload: id });
  }, []);

  // 모든 업로드 제거
  const clearAllUploads = useCallback(() => {
    dispatch({ type: "CLEAR_ALL_UPLOADS" });
  }, []);

  // 가시성 설정
  const setVisibility = useCallback((visible: boolean) => {
    dispatch({ type: "SET_VISIBILITY", payload: visible });
  }, []);

  const value = {
    state,
    dispatch,
    addUpload,
    updateUploadStatus,
    removeUpload,
    clearAllUploads,
    setVisibility,
  };

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
}

// Hook
export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
