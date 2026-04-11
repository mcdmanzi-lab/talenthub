# TalentHub Rwanda — Vue 3 Project

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
http://localhost:5173
```

## Project Structure

```
src/
├── main.js              # App entry point
├── supabase.js          # Supabase + Resend config
├── style.css            # Global design system
├── App.vue              # Root component
├── router/
│   └── index.js         # All routes + auth guards
├── stores/
│   ├── auth.js          # User session & profile state
│   └── toast.js         # Notification system
├── components/
│   ├── Navbar.vue        # Top navigation
│   ├── JobCard.vue       # Job listing card
│   ├── ApplyModal.vue    # Apply + CV upload modal
│   └── ToastNotification.vue
└── views/
    ├── Landing.vue       # Home page
    ├── Jobs.vue          # Browse & filter jobs
    ├── Login.vue         # Sign in
    ├── Register.vue      # Sign up (role selection)
    ├── Dashboard.vue     # Worker + Employer dashboard
    ├── PostJob.vue       # Post a new job
    ├── Admin.vue         # Admin panel
    └── Forgot.vue        # Password reset
```

## Bugs Fixed from V3

1. ✅ Broken `<script>` tag — admin code was inside `src` attribute
2. ✅ Profile never created on register — changed `update` to `upsert`
3. ✅ Public job board showed ALL jobs — now filters `status=approved` only
4. ✅ Employer had no applicants view — full applicants tab added
5. ✅ Dashboard didn't differentiate employer vs worker — now role-aware
6. ✅ No job status badge in dashboard — now shows pending/approved/rejected
7. ✅ `showDashTab` active state broken — rewritten with proper tab IDs
8. ✅ Duplicate application not checked — now prevented

## New Features Added

- 📄 CV/Resume upload (Supabase Storage `cvs` bucket)
- 📧 Email notifications via Resend on new applications
- ⏰ Job expiry (30 days auto-set on post)
- 👔 Employer applicants dashboard with CV download
- 🔒 Route guards (auth + admin protection)

## Supabase Setup

Run this SQL in your Supabase SQL editor:

```sql
create table profiles (
  id uuid references auth.users primary key,
  full_name text, email text, phone text,
  role text default 'worker',
  created_at timestamptz default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  title text, company text, location text,
  type text, salary text, description text,
  tags text[], status text default 'pending',
  employer_id uuid, employer_name text, employer_email text,
  admin_note text, remote boolean default false,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days')
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  applicant_id uuid, applicant_name text,
  applicant_email text, cover_letter text,
  cv_url text, status text default 'pending',
  created_at timestamptz default now()
);

create table recovery_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text, phone text, message text,
  created_at timestamptz default now()
);
```

Also create a **Storage bucket** called `cvs` (Private).

## New Tables (Phase 1 Features)

Run this additional SQL in Supabase:

```sql
-- Worker portfolio items
create table portfolio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  title text, description text, url text,
  created_at timestamptz default now()
);

-- Work experience
create table experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  role text, company text,
  start_year text, end_year text, description text,
  created_at timestamptz default now()
);

-- Company profiles
create table companies (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid references auth.users unique,
  name text, industry text, size text,
  location text, website text, about text,
  created_at timestamptz default now()
);

-- Company reviews
create table company_reviews (
  id uuid primary key default gen_random_uuid(),
  company_employer_id uuid references auth.users,
  author_id uuid references auth.users,
  author_name text, rating int, content text,
  created_at timestamptz default now()
);

-- Saved/bookmarked jobs
create table saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  job_id uuid references jobs(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, job_id)
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users,
  sender_name text,
  receiver_id uuid references auth.users,
  receiver_name text,
  subject text, content text,
  read_by_receiver boolean default false,
  created_at timestamptz default now()
);

-- Add new columns to profiles
alter table profiles add column if not exists title text;
alter table profiles add column if not exists location text;
alter table profiles add column if not exists website text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists skills text[];
alter table profiles add column if not exists open_to_work boolean default false;
```

## Phase 2 Features SQL

Run this in Supabase SQL Editor:

```sql
-- Job alerts
create table job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users unique,
  email text,
  skills text[],
  active boolean default true,
  created_at timestamptz default now()
);

-- Featured job requests
create table featured_requests (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid references auth.users,
  employer_name text, employer_email text,
  job_id uuid references jobs(id),
  plan text, price text, days int,
  pay_method text, pay_phone text,
  pay_proof text, pay_ref text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Add featured column to jobs
alter table jobs add column if not exists featured boolean default false;
alter table jobs add column if not exists featured_until timestamptz;
```
