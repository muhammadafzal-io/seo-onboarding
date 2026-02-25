# SEO Agent — Client Onboarding Form

Minimal, professional Next.js onboarding form that saves data directly to Supabase.

---

## Quick Setup (5 steps)

### 1. Install dependencies
```bash
npm install
```

### 2. Supabase Setup
1. Go to [supabase.com](https://supabase.com) → your project
2. Open **SQL Editor**
3. Run the contents of `supabase-setup.sql`

### 3. Environment Variables
Open `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
- Supabase dashboard → Settings → API
- Copy `Project URL` and `anon public` key

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel (free)
```bash
npx vercel
```
Add your env variables in Vercel dashboard → Settings → Environment Variables.

---

## What Gets Saved to DB

When a client submits the form:

1. **`clients` table** — Full client profile inserted
2. **`articles` table** — Each keyword inserted as a row with `status = 'scouted'`
3. **`agent_logs` table** — Onboarding event logged

---

## Form Flow

```
Step 1: About You       → name, email
Step 2: Your Business   → domain, niche, competitors
Step 3: SEO Strategy    → keywords, tone of voice
Step 4: Publishing      → blog_id, schedule, notes
```

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js 14 | React framework |
| Supabase | PostgreSQL database |
| Vercel | Deployment (free) |
