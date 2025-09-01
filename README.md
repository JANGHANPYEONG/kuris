# KUris Chatbot

Next.js 기반의 챗봇 애플리케이션입니다.

## 🚀 배포 가이드

### Vercel 배포 (추천)

1. **Vercel 계정 생성**

   - [vercel.com](https://vercel.com)에서 GitHub 계정으로 로그인

2. **프로젝트 배포**

   - Vercel 대시보드에서 "New Project" 클릭
   - GitHub 저장소 연결
   - 자동으로 Next.js 프로젝트 감지됨
   - "Deploy" 클릭

3. **환경 변수 설정** (필요한 경우)
   - 프로젝트 설정 → Environment Variables에서 추가

### 다른 배포 옵션

#### Netlify

```bash
# 빌드 명령어
npm run build
# 배포 디렉토리
.next
```

#### GitHub Pages

```bash
# next.config.ts에 추가
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};
```

## 🛠️ 로컬 개발

```bash
npm install
npm run dev
```

## 📦 빌드

```bash
npm run build
npm start
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
