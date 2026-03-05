# EMS Narrative Template Manager

Next.js + Tailwind + Supabase app for storing IFT EMS narrative templates, adding tags, and filtering quickly while charting.

## Features

- Create, edit, and delete narrative templates
- Add reusable tags
- Assign multiple tags to each template
- Filter templates by tag
- Optional username/password accounts
- Personal templates visible only to the signed-in owner
- Feed vs personal template view switch when signed in

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
- `AUTH_SESSION_SECRET`

3. Create tables in Supabase by running migrations in order:

- `supabase/migrations/20260304140500_init_ems_narratives.sql`
- `supabase/migrations/20260304152000_add_template_lock.sql`
- `supabase/migrations/20260304183000_tags_case_insensitive_unique.sql`
- `supabase/migrations/20260304192000_add_local_user_auth_and_narrative_ownership.sql`

4. Start the app:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Notes

- Guests can still create and manage main feed templates without an account.
- Signed-in users can create personal templates and switch between `Main Feed` and `My Templates`.
- API routes enforce personal template ownership server-side.
