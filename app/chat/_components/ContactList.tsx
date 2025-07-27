import React from "react";
import ContactCard from "./ContactCard";

export default function ContactList() {
  const executives = [
    {
      position: "회장",
      name: "홍길동",
      phone: "010-1234-5678",
      instagram: "hong_gildong",
      kakao: "hong123",
    },
    {
      position: "부회장",
      name: "김영희",
      phone: "010-2345-6789",
      instagram: "kim_younghee",
      kakao: "kim456",
    },
    {
      position: "총무",
      name: "박철수",
      phone: "010-3456-7890",
      instagram: "park_cheolsu",
      kakao: "park789",
    },
  ];

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-6 text-gray-800">임원진 연락처</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {executives.map((executive, index) => (
          <ContactCard
            key={index}
            position={executive.position}
            name={executive.name}
            phone={executive.phone}
            instagram={executive.instagram}
            kakao={executive.kakao}
          />
        ))}
      </div>
    </div>
  );
}
