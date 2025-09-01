# KUris Chatbot

[![Next.js](https://img.shields.io/badge/Next.js-15.4.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.56.1-green)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-4.68.0-orange)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

KUris is an AI-powered chatbot built with Next.js, Supabase, and OpenAI. It leverages Retrieval-Augmented Generation (RAG) with vector embeddings and provides an admin dashboard for managing content and analytics. Supports multilingual interactions (Korean, English).

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security](#security)
- [Contributing](#contributing)
- [Contributors](#contributors)
- [License](#license)

## Features

### Core Functionality

- Conversational AI powered by OpenAI GPT with streaming responses
- Retrieval-Augmented Generation (RAG) using pgvector for similarity search
- Automatic intent classification and routing
- Multilingual support (Korean, English, Japanese, Chinese)
- Real-time chat interface with ChatGPT-style experience

### Admin Dashboard

- Upload and manage guidelines/knowledge base
- User analytics and chat statistics
- System configuration and contact management
- Secure role-based authentication

### Technical Implementation

- Vector embeddings with OpenAI
- Supabase Edge Functions for serverless processing
- Real-time PostgreSQL with subscriptions
- Type-safe implementation with TypeScript
- Form validation using React Hook Form + Zod

## Tech Stack

### Frontend

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form, Zod

### Backend & Database

- Supabase (PostgreSQL, Auth, Storage)
- pgvector for similarity search
- Edge Functions (serverless)

### AI & ML

- OpenAI GPT (chat responses)
- OpenAI Embeddings (vectorization)
- Custom RAG pipeline

### Other

- Naver Maps API
- React Markdown

## Installation

### Prerequisites

- Node.js 18+
- npm 8+
- Supabase account & project

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/kuris-chatbot.git](https://github.com/JANGHANPYEONG/kuris.git
   cd kuris
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   supabase db push
   supabase functions deploy
   ```

4. **Create environment variables**

   Create `.env.local` in project root:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SUPABASE_EDGE_URL=your_supabase_edge_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   ```

## Usage

### Development

```bash
npm run dev
```

App runs at `http://localhost:3000`

### Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Add environment variables in dashboard
3. Automatic deployment on main branch push

### Manual Deployment

1. Set environment variables
2. Run `npm run build`
3. Serve `.next/` with Node.js or container

### CI/CD

Example GitHub Actions workflow (`.github/workflows/ci.yml`):

```yaml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

## API Documentation

### Chat API

**POST** `/api/ask`

**Request Body:**

```json
{
  "question": "string",
  "language": "ko|en|ja|zh",
  "stream": true
}
```

**Response:**

```json
{
  "answer": "string",
  "sources": [
    {
      "title": "string",
      "content": "string",
      "similarity": 0.95
    }
  ],
  "intent": "string",
  "language": "ko"
}
```

### Admin APIs

- **POST** `/api/admin/login` – Admin login
- **POST** `/api/admin/guidelines/upload` – Upload guidelines
- **GET** `/api/admin/contacts` – Fetch contacts
- **POST** `/api/admin/settings` – Update system settings

## Project Structure

```
kuris/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── chat/              # Chat interface
│   └── globals.css        # Global styles
├── components/            # Shared components
├── lib/                   # Utilities (OpenAI, Supabase, etc.)
├── supabase/              # DB migrations & edge functions
├── docs/                  # Documentation
└── public/                # Static assets
```

## Security

- Row Level Security (RLS) policies in Supabase
- Role-based admin authentication
- Input validation & rate limiting
- Sanitized responses to prevent XSS
- **Important**: Never commit `.env.local` files to version control

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature/my-feature`)
5. Open Pull Request

### Code Style

- Use TypeScript
- Follow ESLint rules
- Add tests for new features
- Update docs as needed

## Contributors

- **JINSEONG JEONG** ([@JANGHANPYEONG](https://github.com/JANGHANPYEONG))

## License

This project is licensed under the MIT License – see [LICENSE](LICENSE).

## Acknowledgments

- [Next.js](https://nextjs.org/) team
- [Supabase](https://supabase.com/)
- [OpenAI](https://openai.com/)
- [Vercel](https://vercel.com/)
