# My Portfolio

A professional developer portfolio with project publishing, Markdown articles, a contact inbox, and a printable resume. The application is built with React, TypeScript, Vite, Supabase, and a Supabase Edge Function.

## Stack

- React 19 + TypeScript
- Vite 6
- React Router
- Tailwind CSS 4
- Supabase Auth, Postgres, Storage, and Edge Functions
- Express/Vite development server

## Local setup

1. Install Node.js 20+.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and set:

   ```bash
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3001`.

The frontend intentionally shows a setup notice until the public Supabase variables are configured. Server-only secrets must never be placed in `VITE_*` variables.

## Supabase setup

1. Create a Supabase project.
2. Install the Supabase CLI and link the project:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Apply the schema and RLS policies:

   ```bash
   supabase db push
   ```

4. In Supabase Auth, enable Google and add the local and production redirect URLs.
5. Create a `portfolio-media` Storage bucket or apply the storage policy in the migration.
6. Set the owner account UUID used by the admin area and Edge Function.
7. Create the owner profile once:

   ```bash
   npm run bootstrap:owner
   ```

The initial schema is in:

```text
supabase/migrations/20260925000000_initial_schema.sql
```

## Contact Edge Function

The contact form calls the `contact` Supabase Edge Function. Configure these function secrets:

```bash
supabase secrets set \
  SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
  PORTFOLIO_OWNER_ID=YOUR_OWNER_USER_UUID \
  TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN \
  TELEGRAM_CHAT_ID=YOUR_CHAT_ID \
  ALLOWED_ORIGIN=https://your-domain.example
```

Deploy the function with:

```bash
supabase functions deploy contact
```

The function validates input, applies a database-backed rate limit, stores the message, and sends a plain-text Telegram notification. Service-role credentials are only used inside the function.

## Migrating the existing Firestore data

The legacy Firebase files remain in the repository only as a migration source and rollback reference. Do not use them in the application.

Set the migration variables in `.env.local` or your shell:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_OWNER_ID=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
```

Preview the migration:

```bash
npm run migrate:firestore
```

After reviewing the backup and counts, apply it:

```bash
npm run migrate:firestore -- --apply
```

The script migrates the profile, projects, posts, and messages, and converts base64 images into Supabase Storage objects. Keep the Firestore project untouched until record counts and sample records have been verified.

## Production

Build the frontend:

```bash
npm run typecheck
npm run build
npm start
```

`npm start` runs the Express server. Set `NODE_ENV=production` and `PORT` in the hosting provider. The server exposes `/healthz` and serves the built SPA from `dist/`.

The frontend can be deployed to Vercel, Render, or another static host. Supabase provides the database, authentication, storage, and contact function, so the Node server is optional for the core application.

## Quality checks

```bash
npm run typecheck
npm run build
```

Before deploying, verify:

- Published projects and posts are publicly readable.
- Only the owner can write content.
- Anonymous users cannot read messages.
- The contact function stores messages and sends Telegram notifications.
- Images are served from Supabase Storage.
- Google OAuth redirect URLs are configured for the deployed domain.
