# Zenacle Home — PWA

## Setup (first time)

```bash
# 1. Install Node.js 18+ if not already installed
# https://nodejs.org

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

## What you'll see

- `/welcome` — Onboarding screens (4 slides, dark green)
- `/login`   — Phone OTP login
- `/`        — Home screen with real Supabase data
- `/usage`   — Placeholder (to be built)
- `/reports` — Placeholder (to be built)
- `/settings`— Placeholder (to be built)

## Auth note

`auth.users` in Supabase is currently empty.
The login screen is built and ready.
Before Sadhir can log in, a one-time migration is needed to
create his auth account. This will be done separately — confirm
with Sadhir before running it.

## Supabase project

- Project ID: llmyvutkvrxnhzkptbar
- URL: https://llmyvutkvrxnhzkptbar.supabase.co
- Anon key: in src/lib/supabase.js

## Build for production

```bash
npm run build
# Output in /dist — deploy to Vercel or any static host
```
