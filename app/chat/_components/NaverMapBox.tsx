import React from "react";

export default function NaverMapBox() {
  return (
    <div className="p-8 w-full h-full flex flex-col items-center justify-center">
      <h2 className="text-xl font-bold mb-4">네이버맵</h2>
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        {/* 실제 네이버맵 iframe 또는 컴포넌트로 교체 가능 */}
        <span className="text-gray-500">여기에 네이버맵이 표시됩니다.</span>
      </div>
    </div>
  );
}
