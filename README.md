# EMS Narrative Template Manager

Next.js + Tailwind + Supabase app for storing IFT EMS narrative templates, adding tags, and filtering quickly while charting.

## Features

- Create, edit, and delete narrative templates
- Add reusable tags
- Assign multiple tags to each template
- Filter templates by tag
- No authentication yet (intentionally disabled for MVP)

## Stack

- Next.js (App Router)
- Tailwind CSS v4
- Supabase (Postgres)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables:

```bash
cp .env.example .env.local
```

Set values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

3. Create tables in Supabase by running:

- `supabase/migrations/20260304140500_init_ems_narratives.sql`

4. Start the app:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Important Note

This version does not include auth or row-level security policies. Add auth + RLS before production use.
