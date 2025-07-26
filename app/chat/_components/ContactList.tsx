import React from "react";

export default function ContactList() {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">임원진 연락처</h2>
      <ul className="space-y-2 text-gray-700">
        <li>회장: 홍길동 - 010-1234-5678</li>
        <li>부회장: 김영희 - 010-2345-6789</li>
        <li>총무: 박철수 - 010-3456-7890</li>
      </ul>
    </div>
  );
}
