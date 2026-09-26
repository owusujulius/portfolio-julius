create extension if not exists "pgcrypto";

-- Keep timestamps consistent for editable content.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Creation timestamps are immutable after a record is written.
create or replace function public.prevent_created_at_change()
returns trigger
language plpgsql
as $$
begin
  if new.created_at is distinct from old.created_at then
    raise exception 'created_at is immutable';
  end if;
  return new;
end;
$$;

-- A contact message is terminal after creation. Only read state may change.
create or replace function public.protect_message_fields()
returns trigger
language plpgsql
as $$
begin
  if new.legacy_id is distinct from old.legacy_id
     or new.name is distinct from old.name
     or new.email is distinct from old.email
     or new.subject is distinct from old.subject
     or new.message is distinct from old.message
     or new.owner_id is distinct from old.owner_id
     or new.created_at is distinct from old.created_at then
    raise exception 'message content is immutable';
  end if;
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 120),
  role text not null default '' check (char_length(role) <= 160),
  bio text not null default '' check (char_length(bio) <= 10000),
  email text check (email is null or char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 50),
  location text check (location is null or char_length(location) <= 200),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 2048),
  logo_path text check (logo_path is null or char_length(logo_path) <= 2048),
  resume_url text check (resume_url is null or char_length(resume_url) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('github', 'linkedin', 'twitter', 'instagram', 'whatsapp')),
  url text not null check (char_length(url) between 1 and 2000),
  sort_order integer not null default 0,
  unique (profile_id, platform)
);

create table public.experience (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company text not null default '' check (char_length(company) <= 200),
  role text not null default '' check (char_length(role) <= 200),
  period text not null default '' check (char_length(period) <= 100),
  description text not null default '' check (char_length(description) <= 5000),
  sort_order integer not null default 0
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  school text not null default '' check (char_length(school) <= 200),
  degree text not null default '' check (char_length(degree) <= 200),
  period text not null default '' check (char_length(period) <= 100),
  sort_order integer not null default 0
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  sort_order integer not null default 0
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  value text not null check (char_length(value) between 1 and 500),
  sort_order integer not null default 0
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null check (char_length(description) <= 5000),
  tech_stack text[] not null default '{}' check (cardinality(tech_stack) <= 30),
  live_url text check (live_url is null or char_length(live_url) <= 2000),
  github_url text check (github_url is null or char_length(github_url) <= 2000),
  image_path text check (image_path is null or char_length(image_path) <= 2048),
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 250),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  content text not null check (char_length(content) <= 200000),
  excerpt text not null default '' check (char_length(excerpt) <= 1000),
  category text not null default '' check (char_length(category) <= 100),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  status text not null default 'draft' check (status in ('draft', 'published')),
  cover_image_path text check (cover_image_path is null or char_length(cover_image_path) <= 2048),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  subject text not null default '' check (char_length(subject) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  archived boolean not null default false
);

-- Private table used by the contact Edge Function for throttling.
create table public.contact_rate_limits (
  key text primary key,
  request_count integer not null default 0,
  window_start timestamptz not null default now()
);

create index projects_public_order_idx on public.projects (status, sort_order, created_at desc);
create index posts_public_order_idx on public.posts (status, published_at desc, created_at desc);
create index messages_owner_created_idx on public.messages (owner_id, created_at desc);
create index profile_links_profile_idx on public.profile_links (profile_id, sort_order);
create index experience_profile_idx on public.experience (profile_id, sort_order);
create index education_profile_idx on public.education (profile_id, sort_order);
create index skills_profile_idx on public.skills (profile_id, sort_order);
create index achievements_profile_idx on public.achievements (profile_id, sort_order);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create trigger projects_immutable_created_at
  before update on public.projects
  for each row execute function public.prevent_created_at_change();

create trigger posts_immutable_created_at
  before update on public.posts
  for each row execute function public.prevent_created_at_change();

create trigger messages_immutable_content
  before update on public.messages
  for each row execute function public.protect_message_fields();

alter table public.profiles enable row level security;
alter table public.profile_links enable row level security;
alter table public.experience enable row level security;
alter table public.education enable row level security;
alter table public.skills enable row level security;
alter table public.achievements enable row level security;
alter table public.projects enable row level security;
alter table public.posts enable row level security;
alter table public.messages enable row level security;
alter table public.contact_rate_limits enable row level security;

create policy "Public can read profiles"
  on public.profiles for select
  using (true);

create policy "Owners can create profiles"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Owners can update profiles"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owners can delete profiles"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Public can read profile links"
  on public.profile_links for select
  using (exists (select 1 from public.profiles p where p.id = profile_id));

create policy "Owners can manage profile links"
  on public.profile_links for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()));

create policy "Public can read experience"
  on public.experience for select
  using (exists (select 1 from public.profiles p where p.id = profile_id));

create policy "Owners can manage experience"
  on public.experience for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()));

create policy "Public can read education"
  on public.education for select
  using (exists (select 1 from public.profiles p where p.id = profile_id));

create policy "Owners can manage education"
  on public.education for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()));

create policy "Public can read skills"
  on public.skills for select
  using (exists (select 1 from public.profiles p where p.id = profile_id));

create policy "Owners can manage skills"
  on public.skills for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()));

create policy "Public can read achievements"
  on public.achievements for select
  using (exists (select 1 from public.profiles p where p.id = profile_id));

create policy "Owners can manage achievements"
  on public.achievements for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()));

create policy "Public can read published projects"
  on public.projects for select
  using (status = 'published' or auth.uid() = owner_id);

create policy "Owners can create projects"
  on public.projects for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners can update projects"
  on public.projects for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners can delete projects"
  on public.projects for delete
  to authenticated
  using (auth.uid() = owner_id);

create policy "Public can read published posts"
  on public.posts for select
  using (status = 'published' or auth.uid() = owner_id);

create policy "Owners can create posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners can update posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners can delete posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = owner_id);

create policy "Owners can read messages"
  on public.messages for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "Owners can update messages"
  on public.messages for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners can delete messages"
  on public.messages for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Explicit grants keep anonymous clients limited to read operations.
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.profile_links, public.experience, public.education, public.skills, public.achievements, public.projects, public.posts to anon, authenticated;
grant insert, update, delete on public.profiles, public.profile_links, public.experience, public.education, public.skills, public.achievements, public.projects, public.posts to authenticated;
grant select, update, delete on public.messages to authenticated;

-- Atomic, server-side throttling for anonymous contact submissions.
create or replace function public.consume_contact_rate_limit(
  p_key text,
  p_max integer default 5,
  p_window_seconds integer default 3600
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  current_window timestamptz;
begin
  if p_max < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.contact_rate_limits (key, request_count, window_start)
  values (p_key, 1, now())
  on conflict (key) do nothing;

  select request_count, window_start
    into current_count, current_window
    from public.contact_rate_limits
   where key = p_key
   for update;

  if current_window < now() - make_interval(secs => p_window_seconds) then
    update public.contact_rate_limits
       set request_count = 1,
           window_start = now()
     where key = p_key;
    return true;
  end if;

  if current_count >= p_max then
    return false;
  end if;

  update public.contact_rate_limits
     set request_count = current_count + 1
   where key = p_key;

  return true;
end;
$$;

revoke all on function public.consume_contact_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_contact_rate_limit(text, integer, integer) to service_role;

-- Public media bucket. Files must be written under the authenticated user's folder.
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = excluded.public;

create policy "Public can read portfolio media"
  on storage.objects for select
  using (bucket_id = 'portfolio-media');

create policy "Owners can upload portfolio media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Owners can update portfolio media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio-media' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'portfolio-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Owners can delete portfolio media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio-media' and auth.uid()::text = (storage.foldername(name))[1]);
