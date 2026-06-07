# Deploy to Vercel with Neon Database

This app uses **Neon PostgreSQL** for data storage — required for Vercel serverless deployment.

## Step 1: Create a Neon database

1. Go to [neon.tech](https://neon.tech) and sign up (free tier available)
2. Click **New Project**
3. Choose a name and region (pick one close to your Vercel region)
4. After creation, copy the **Connection string** (PostgreSQL)
   - It looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

## Step 2: Set environment variables on Vercel

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your Neon connection string | **Yes** |
| `ADMIN_PASSWORD` | Strong admin password | **Yes** |
| `SESSION_SECRET` | Random string (`openssl rand -hex 32`) | **Yes** |

Apply to **Production**, **Preview**, and **Development**.

## Step 3: Deploy

```bash
git add .
git commit -m "Use Neon PostgreSQL for Vercel"
git push
```

Or via CLI:

```bash
vercel env add DATABASE_URL
vercel env add ADMIN_PASSWORD
vercel env add SESSION_SECRET
vercel --prod
```

On first request, the app **auto-creates tables** and **seeds sample content**.

## Step 4: Verify

| URL | Expected |
|-----|----------|
| `https://your-app.vercel.app/` | Public portfolio |
| `https://your-app.vercel.app/admin` | Admin login |
| `https://your-app.vercel.app/api/content` | JSON data |

Sign in with your `ADMIN_PASSWORD`.

---

## Local development with Neon

Add to your `.env` file:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
ADMIN_PASSWORD=admin123
SESSION_SECRET=local-dev-secret
PORT=8637
```

Then start:

```bash
npm install
./start.sh
```

You can use the **same Neon database** for local dev, or create a separate Neon branch for development.

---

## Neon + Vercel integration (optional)

Vercel marketplace can link Neon automatically:

1. Vercel dashboard → **Storage** → **Create Database** → **Neon**
2. This auto-sets `DATABASE_URL` on your project

---

## Remaining limitation: image uploads

Database content **persists** on Neon. However, **uploaded images** still go to `/tmp` on Vercel and **won't persist** across deployments.

| Content type | Persists on Vercel? |
|--------------|---------------------|
| Text (profile, jobs, etc.) | Yes (Neon) |
| Default SVG images | Yes (bundled in repo) |
| Uploaded photos | No — use [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for production uploads |

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `500 FUNCTION_INVOCATION_FAILED` | Check `DATABASE_URL` is set in Vercel env vars |
| `Database unavailable` | Verify Neon connection string includes `?sslmode=require` |
| Tables empty after deploy | Visit the site once — seed runs on first init |
| Admin login fails | Confirm `ADMIN_PASSWORD` env var matches what you type |
| Login works then fails | Serverless sessions — may need Redis/KV for production |

### View logs

Vercel → **Deployments** → click latest → **Functions** → **Logs**

Look for `Database unavailable` or connection errors.

---

## Environment variables checklist

- [ ] `DATABASE_URL` — Neon PostgreSQL connection string
- [ ] `ADMIN_PASSWORD` — changed from default
- [ ] `SESSION_SECRET` — random 32+ character string
