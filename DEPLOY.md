# Vercel Deployment Guide — Web Portal

## Root Cause of the `localhost:7854` Redirect Bug

When the deployed site redirects to `http://localhost:7854/login`, it means
`NEXTAUTH_URL=http://localhost:7854` was set inside Vercel's environment variables.
NextAuth uses that variable to build redirect URLs — in production it must **not be set**
so NextAuth v5 can auto-detect the real Vercel URL.

---

## Step-by-Step Fix

### 1. Open Vercel Dashboard → Your Project → Settings → Environment Variables

Go to: **https://vercel.com/doanhuynh049s-projects/web-portal/settings/environment-variables**

### 2. Delete (or never add) `NEXTAUTH_URL`

| Variable | Action |
|----------|--------|
| `NEXTAUTH_URL` | ❌ **Delete it** — must not exist on Vercel |

> NextAuth v5 (`next-auth@^5`) automatically detects `VERCEL_URL` and `AUTH_URL` at
> runtime. Setting `NEXTAUTH_URL` to anything on Vercel overrides this detection and
> causes every auth redirect to point to whatever value you set.

### 3. Verify the required variables are set correctly

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your Neon connection string | Must include `sslmode=require&channel_binding=require` |
| `AUTH_SECRET` | One strong random string | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | **Same value as `AUTH_SECRET`** | NextAuth v5 reads both; they must match |

> ⚠️ In the local `.env.local` file, `NEXTAUTH_SECRET` and `AUTH_SECRET` have **different
> values**. On Vercel, both must be the **same** secret. Generate a fresh one:
>
> ```bash
> openssl rand -base64 32
> ```
>
> Paste the output into **both** `AUTH_SECRET` and `NEXTAUTH_SECRET` in Vercel.

### 4. Redeploy

After saving environment variables, trigger a new deployment:
- Vercel Dashboard → **Deployments** → **Redeploy** (top-right button on the latest deploy), OR
- Push any commit to `master`:
  ```bash
  git commit --allow-empty -m "chore: trigger redeploy" && git push
  ```

### 5. Seed the database (first deploy only)

After the new deployment is live, visit this URL once:

```
https://web-portal-five-theta.vercel.app/api/setup
```

This creates the default user and Neon schema (idempotent — safe to call again).

Default credentials after seeding:
- Email: `quocthien049@gmail.com`
- Password: `doanhuynh0409`

---

## Full Environment Variable Reference

| Variable | Local `.env.local` | Vercel Production |
|----------|--------------------|-------------------|
| `DATABASE_URL` | Neon connection string | Same Neon connection string |
| `AUTH_SECRET` | Any random string | **Same value** as `NEXTAUTH_SECRET` |
| `NEXTAUTH_SECRET` | Any random string | **Same value** as `AUTH_SECRET` |
| `NEXTAUTH_URL` | `http://localhost:7854` | ❌ **Do not set** |

---

## Checklist Before Every Deploy

- [ ] `NEXTAUTH_URL` does NOT exist in Vercel env vars
- [ ] `AUTH_SECRET` and `NEXTAUTH_SECRET` have the **same value**
- [ ] `DATABASE_URL` is set and ends with `sslmode=require&channel_binding=require`
- [ ] All pages that call `readData()` have `export const dynamic = "force-dynamic"` at the top
- [ ] After first deploy: visited `/api/setup` to create user + Neon schema

---

## Vercel CLI Quick Workflow

```bash
# Install Vercel CLI (once)
npm i -g vercel

# Link project (once, in repo root)
vercel link

# Push env vars from CLI (alternative to dashboard)
vercel env rm NEXTAUTH_URL production          # remove the bad var
vercel env add AUTH_SECRET production          # paste your secret when prompted
vercel env add NEXTAUTH_SECRET production      # paste the SAME secret

# Deploy
vercel --prod
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Redirect to `localhost:7854` | `NEXTAUTH_URL` set on Vercel | Delete that variable |
| "Sessions will not work" in logs | `AUTH_SECRET` / `NEXTAUTH_SECRET` not set | Add both with the same value |
| Blank page / 500 on `/` | Missing `export const dynamic = "force-dynamic"` | Add to pages calling `readData()` |
| Login succeeds but data is empty | Neon not seeded | Visit `/api/setup` once |
| DB errors on first request then fast | Circuit breaker opened (expected) | Wait 60 s for retry, or check `DATABASE_URL` |
