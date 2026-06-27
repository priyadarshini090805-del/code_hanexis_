# AI Lead Gen — AI-Driven Social Media Lead Generation System

A full-stack SaaS platform that captures leads from social/ad channels, enriches and scores them, generates personalized outreach with AI, and runs multi-step campaigns across **LinkedIn**, **Instagram**, and **email** — with built-in scheduling, conversations, and analytics.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Prisma + PostgreSQL**, **NextAuth**, and an **OpenRouter**-backed AI layer.

🔗 Live: https://hanxes-2.vercel.app

---

## ✨ Features

| Module | What it does |
|--------|--------------|
| **Auth & Users** | Email/password + Google & LinkedIn OAuth, JWT sessions, refresh tokens, 2FA, CSRF protection, role-based access |
| **Lead Management** | Create / import (CSV/XLSX) / tag / score leads, activity timeline, status history |
| **AI Engine** | Generate personalized messages & content via OpenRouter (industry / role / context-aware prompts) with an approval workflow |
| **Outreach & Workflows** | Visual multi-step workflow builder, execution engine, monitoring |
| **Campaigns** | Launch and track outreach campaigns with per-campaign analytics & history |
| **Scheduler & Queue** | Scheduled messages/content, publishing queue, follow-up reminders, notifications |
| **Content** | AI content creation, versioning, scheduled publishing |
| **Conversations** | Unified inbox with AI-suggested replies |
| **Integrations** | LinkedIn, Instagram & Google (Gmail) — OAuth connect, publish, sync, webhooks |
| **Analytics** | KPIs, funnel, campaign performance, CSV export |
| **Audit & Security** | Audit logs, rate limiting, data encryption, failed-login tracking |

---

## 🧱 Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, lucide-react
- **Backend:** Next.js API routes (REST), Zod validation
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **Auth:** NextAuth v5 + JWT + OAuth 2.0 (Google, LinkedIn)
- **AI:** OpenRouter (default model: `meta-llama/llama-3.3-70b-instruct`)
- **Queue/Cache:** Redis (Upstash recommended in production)
- **Email:** Resend / Nodemailer
- **Deploy:** Vercel (cron jobs) / Docker

---

## 🚀 Getting Started (Local)

### Prerequisites
- Node.js 20+
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- (Optional) Redis for queue/scheduler features

### Setup

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env.local
#   then fill in the values (see "Environment Variables" below)

# 3. Generate Prisma client & push schema
npx prisma generate
npx prisma db push

# 4. Run the dev server
npm run dev
```

App runs at http://localhost:3000

### Useful scripts

```bash
npm run dev            # start dev server
npm run build          # prisma generate + production build
npm run start          # run production build
npm run lint           # eslint
npm run test           # jest unit tests
npm run prisma:studio  # browse the database
```

---

## 🔑 Environment Variables

See [`.env.example`](./.env.example) for the full list. Key groups:

| Group | Variables |
|-------|-----------|
| Database | `DATABASE_URL`, `DATABASE_DIRECT_URL` |
| Auth | `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET` |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| LinkedIn OAuth | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| Instagram | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_WEBHOOK_TOKEN` |
| AI | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |
| Redis | `REDIS_URL` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` |
| Security | `ENCRYPTION_KEY`, `CRON_SECRET` |

---

## ☁️ Deployment (Vercel)

1. Import this repo into Vercel — it auto-detects **Next.js**.
2. Build command is preset in [`vercel.json`](./vercel.json) → `npm run vercel-build` (runs `prisma generate` + `prisma db push` + `next build`).
3. Add all environment variables (use **Settings → Environment Variables → Import .env**). Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production URL.
4. **Redis:** use a hosted Redis ([Upstash](https://upstash.com)) for the queue/scheduler/notifications — `localhost` does not work on serverless.
5. **OAuth:** add `https://<your-domain>/api/auth/callback/google` and `.../callback/linkedin` to the providers' authorized redirect URIs.

Two cron jobs are configured in `vercel.json`:
- `/api/cron/process-scheduled` — every minute
- `/api/cron/poll-gmail` — every 10 minutes

Docker is also supported via the included `Dockerfile` / `docker-compose.yml`.

---

## 📁 Project Structure

```
app/
  (auth)/            # login, register, forgot/reset password
  dashboard/         # leads, ai, workflows, scheduler, queue, content,
                     #   conversations, campaigns, integrations, analytics, audit, settings
  api/               # REST API routes for every module (+ cron, webhooks)
components/          # shared UI (DashboardShell, etc.)
lib/                 # auth, prisma, ai, integrations, queue, security helpers
prisma/schema.prisma # data models
middleware.ts        # auth/route protection
```

See [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) for the full API reference.

---

## 📡 API Overview

Representative endpoints (all under `/api`):

- **Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `auth/2fa/*`
- **Leads:** `GET/POST /leads`, `GET/PUT /leads/:id`, `/leads/:id/activities`
- **AI:** `POST /ai/generate-message`, `/ai/approvals/*`, `/content/generate`
- **Campaigns:** `GET/POST /campaigns`, `/campaigns/:id/launch`, `/campaigns/:id/analytics`
- **Integrations:** `/integrations/linkedin/*`, `/integrations/instagram/*`, `/integrations/google/*`
- **Analytics:** `/analytics/kpi`, `/analytics/funnel`, `/analytics/campaigns`, `/analytics/export`

---

## 🧪 Testing

```bash
npm run test          # Jest unit tests
npm run type-check    # TypeScript check
```

---

## 📄 License

Proprietary — all rights reserved.
