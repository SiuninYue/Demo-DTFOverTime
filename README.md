# DTF Over Time

DTF Over Time is a React + Vite playground for iterating on salary tracking ideas described in `specs/001-dtf-salary-tracker-mvp/`. The app ships with hot module reload, React 19, and eslint-based linting.

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+

Install dependencies after cloning:

```bash
npm install
```

## Development

Start a hot-reloading dev server on http://localhost:5173:

```bash
npm run dev
```

The helper script wraps the same command:

```bash
./scripts/dev.sh
```

> Note: The provided `.env.local` defaults to a mock Supabase client so you can register/login locally without a cloud project. Replace `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env.local` (this file overrides `.env`), set `VITE_SUPABASE_USE_MOCK=false`, and restart `npm run dev` when you have a real Supabase instance. If you previously used the mock client, clear browser `localStorage` keys `mock-supabase-db-v1` and `mock-supabase-auth-v1` so old fake data/auth do not stick around.

## Quality Checks

Run eslint across the project:

```bash
npm run lint
```

Execute the minimal pytest smoke suite (ensures tooling expectations are met):

```bash
pytest
```

Or use the wrapper script that runs lint and pytest together:

```bash
./scripts/test.sh
```

## Production Build

Produce optimized assets in `dist/`:

```bash
npm run build
```

Serve the production bundle locally for smoke tests:

```bash
npm run preview
```
