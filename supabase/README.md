# Supabase setup

The production database is defined by `migrations/20260925000000_initial_schema.sql`.

Apply it with the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration creates:

- `profiles`, `profile_links`, `experience`, `education`, `skills`, `achievements`
- `projects`, `posts`, `messages`
- RLS policies for public reads and owner-only writes
- A public `portfolio-media` Storage bucket
- A private rate-limit table and server-only RPC

The `contact` Edge Function is in `functions/contact`. Configure its secrets with `supabase secrets set` before deploying.
