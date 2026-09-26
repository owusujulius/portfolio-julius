# Security Specification - My Portfolio

## Data invariants

1. Only the authenticated portfolio owner can create, update, or delete projects, posts, and profile data.
2. Public users can read only published projects and posts.
3. The profile and its public resume data are readable by everyone.
4. Messages are private to the owner. Only the server-side contact function may create them.
5. Message content and creation timestamps are immutable after insertion.
6. All slugs, URLs, lengths, and array sizes are validated.
7. Service-role credentials are never exposed to the browser.
8. Media uploads are restricted to the authenticated owner folder.

## Rejection tests

1. Anonymous user creating a project.
2. Non-owner user updating a project.
3. Owner writing an unexpected field such as `owner_id` or `is_admin`.
4. Invalid post status or oversized content.
5. Duplicate or malformed slug.
6. Contact function receiving an invalid email or oversized message.
7. Contact function receiving more than the allowed number of requests.
8. Anonymous user reading the `messages` table.
9. Non-owner user changing message content instead of read state.
10. Storage upload outside the owner's folder.

## RLS design

- `profiles`, `profile_links`, `experience`, `education`, `skills`, and `achievements` are publicly readable.
- `projects` and `posts` are publicly readable only when `status = 'published'`.
- Owner writes use `auth.uid() = owner_id` or the owning profile relation.
- `messages` has no insert policy for `anon` or `authenticated`; the Edge Function uses the service role.
- `contact_rate_limits` is private and accessible only to the server-side function.
- Public media reads are allowed only from the `portfolio-media` bucket; writes require an owner folder path.
