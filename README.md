# Sports Manager — School Sports Event Admin Portal

A full-stack, admin-only web application for managing school sports events, built with:
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend/Auth/DB**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Export**: ExcelJS (XLSX)
- **Theme**: Deep Navy + Gold

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- npm or yarn

---

## Setup Guide

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL**, **Anon Key**, and **Service Role Key** from `Settings → API`

### 2. Run the SQL Schema

1. Go to your Supabase project → **SQL Editor**
2. Copy the contents of `supabase/schema.sql` and run it
3. This creates all tables, enums, indexes, and RLS policies

### 3. Set Up Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named exactly: **`student-photos`**
3. Set it to **Public** (so photo URLs are accessible)
4. Add a policy: `Allow authenticated users to upload` → INSERT for `authenticated`

### 4. Enable Realtime

1. Go to **Database → Replication** in your Supabase dashboard
2. Enable replication for the **`results`** table (and optionally `participants`)

### 5. Create Your First Admin User

Since this is admin-only (no public signup):
1. Go to **Authentication → Users** in Supabase
2. Click **Invite user** or **Add user** and enter your admin email + password
3. Alternatively, use Supabase Auth email invite flow

### 6. Configure Environment Variables

Copy the example file:
```bash
cp .env.local.example .env.local
```

Fill in your values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # from Supabase → Settings → API
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...       # NEVER expose this to the client!
```

### 7. Install Dependencies

```bash
npm install
```

### 8. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

---

## Deployment (Vercel)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add your environment variables in Vercel's dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

> **Note**: The `SUPABASE_SERVICE_ROLE_KEY` is only used in server-side API routes (`/api/export/*`) and never reaches the browser.

---

## Feature Overview

| Feature | Description |
|---|---|
| 🔐 Auth | Admin email/password login via Supabase Auth |
| 👥 Students | CRUD with photo upload, CSV bulk import, category filter |
| 🏠 Groups | Create and manage houses/groups with color swatches |
| 🏃 Events | Create individual/group events with configurable points and multipliers |
| 📋 Participants | Add students or groups to events with live search |
| 🏆 Results | Set 1st/2nd/3rd place; locked events block changes (via RLS) |
| 📊 Leaderboard | Realtime individual + group champion lists with tie-breaking |
| 📥 Export | Download XLSX reports from the leaderboard pages |
| 🖨️ Print | Print-friendly leaderboard via `window.print()` |
| 📱 Responsive | Sidebar collapses on mobile into a slide-in drawer |

---

## Database Schema Summary

```
groups         → id, name, color
students       → id, name, class, category, group_id, photo_url
events         → id, name, type, points_1st/2nd/3rd, point_multiplier, status
participants   → id, event_id, student_id?, group_id?  (UNIQUE constraints)
results        → id, event_id, rank, student_id?, group_id?, points_earned  (UNIQUE on event+rank)
```

### RLS Policy Highlights
- All tables require `authenticated` role for all operations
- `results` INSERT/UPDATE blocked by `is_event_open()` function when event status = `'locked'`

---

## CSV Import Format

The CSV file must have these exact column headers:

```csv
name,class,category,group_name
Arjun Kumar,10A,Junior,Red House
Priya Singh,8B,Sub Junior,Blue House
Rahul Verma,12C,Senior,Gold House
```

- `category` must be exactly: `Sub Junior`, `Junior`, or `Senior`
- `group_name` will be created automatically if it doesn't exist

Download a template from the Students → CSV Import dialog.

---

## Leaderboard Tie-Breaker Logic

When total points are equal, the ranking is determined by:
1. Most **gold** medals (1st place wins)
2. Most **silver** medals (2nd place wins)
3. Most **bronze** medals (3rd place wins)

---

## Tech Stack Details

| Package | Purpose |
|---|---|
| `next@14` | App Router, Server Components, API Routes |
| `@supabase/supabase-js` | Database, Auth, Storage, Realtime client |
| `@supabase/ssr` | Cookie-based auth for SSR/middleware |
| `exceljs` | Server-side XLSX generation |
| `papaparse` | Client-side CSV parsing |
| `lucide-react` | Icon library |
| `sonner` | Toast notifications |
| `tailwindcss` | Utility-first CSS |
