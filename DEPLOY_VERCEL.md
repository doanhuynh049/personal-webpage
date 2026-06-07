# Deploy to Vercel

This guide walks through deploying your personal webpage to [Vercel](https://vercel.com).

## Important: know the limits first

This app uses **SQLite** (file database) and **local file uploads**. Vercel runs **serverless functions** with a **read-only filesystem** (except `/tmp`, which is wiped between invocations).

| Feature | Works on Vercel? | Notes |
|---------|------------------|-------|
| Public page (read-only) | Yes | After DB is seeded |
| Admin login & edit text | Partially | Changes may not persist |
| SQLite database | No (as-is) | File cannot be written reliably |
| Image uploads | No (as-is) | `public/uploads/` is not persistent |

**Recommendation:**

- **Best on Vercel:** use an external database ([Turso](https://turso.tech), [Neon](https://neon.tech)) and file storage ([Vercel Blob](https://vercel.com/docs/storage/vercel-blob)) — requires code changes.
- **Easiest for this project as-is:** deploy to [Railway](https://railway.app), [Render](https://render.com), or a VPS where SQLite and uploads work normally. Use `./start.sh` on those platforms.

The steps below deploy the current app to Vercel for testing or demo purposes. For a production site with admin + uploads, use Railway/Render or migrate storage first.

---

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (GitHub login works)
2. [Vercel CLI](https://vercel.com/docs/cli) (optional but useful):

   ```bash
   npm i -g vercel
   ```

3. Project pushed to GitHub (recommended for auto-deploy)

---

## Step 1: Prepare environment variables

In Vercel, set these under **Project → Settings → Environment Variables**:

| Variable | Example | Required |
|----------|---------|----------|
| `ADMIN_PASSWORD` | `your-strong-password` | Yes |
| `SESSION_SECRET` | random 32+ char string | Yes |
| `PORT` | (Vercel sets this automatically) | No |

Generate a session secret:

```bash
openssl rand -hex 32
```

---

## Step 2: Deploy via GitHub (recommended)

1. Push your project to GitHub:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USER/personal-webpage.git
   git push -u origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new)
3. **Import** your GitHub repository
4. Vercel auto-detects Node.js. Keep defaults:
   - **Framework Preset:** Other
   - **Build Command:** (leave empty or `npm install`)
   - **Output Directory:** (leave empty)
5. Add environment variables (`ADMIN_PASSWORD`, `SESSION_SECRET`)
6. Click **Deploy**

Your site will be live at `https://your-project.vercel.app`.

---

## Step 3: Deploy via CLI (alternative)

From the project folder:

```bash
cd personal-webpage
vercel login
vercel
```

Follow the prompts. For production:

```bash
vercel --prod
```

Set env vars via CLI:

```bash
vercel env add ADMIN_PASSWORD
vercel env add SESSION_SECRET
```

---

## Step 4: Verify deployment

After deploy, check:

| URL | Expected |
|-----|----------|
| `https://your-project.vercel.app/` | Public portfolio page |
| `https://your-project.vercel.app/admin` | Admin login |
| `https://your-project.vercel.app/api/content` | JSON content API |

Sign in to `/admin` with your `ADMIN_PASSWORD`.

---

## Step 5: Custom domain (optional)

1. Vercel dashboard → **Project → Settings → Domains**
2. Add your domain (e.g. `www.yourname.com`)
3. Update DNS records as shown by Vercel
4. HTTPS is automatic

---

## Project files for Vercel

These files are already included:

- **`vercel.json`** — routes all requests to `server.js` as a serverless function
- **`server.js`** — exports the Express app for Vercel; runs `listen()` only when started locally

Local start (unchanged):

```bash
./start.sh
# or
npm start
```

---

## Production options on Vercel

To run admin + database + uploads reliably on Vercel, migrate:

### Database → Turso (SQLite-compatible cloud)

1. Create a database at [turso.tech](https://turso.tech)
2. Replace `node:sqlite` file DB with `@libsql/client`
3. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel env

### Images → Vercel Blob

1. Enable Blob storage in your Vercel project
2. Replace `multer` disk storage with `@vercel/blob` upload
3. Store returned URLs in the database

### Sessions

Serverless functions are stateless. For reliable login across instances, use:

- `@vercel/kv` or Redis for session storage, or
- JWT tokens instead of `express-session`

---

## Easier alternative: Railway or Render

If you want the current app **without code changes**:

### Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set **Start Command:** `./start.sh` or `npm start`
3. Add env vars: `ADMIN_PASSWORD`, `SESSION_SECRET`
4. Railway provides a persistent volume — mount it to `/app/data` and `/app/public/uploads` for persistence

### Render

1. [render.com](https://render.com) → New **Web Service** → connect repo
2. **Build Command:** `npm install`
3. **Start Command:** `./start.sh`
4. Add env vars and attach a **disk** for `data/` and `public/uploads/`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ExperimentalWarning: SQLite` | Normal on Node 22; Vercel uses Node 20+ — may need `--experimental-sqlite` in start script or migrate to Turso |
| Admin login works once then fails | Session not shared across serverless instances — use Redis/KV or JWT |
| Saves disappear after refresh | SQLite file not persisted — use Turso or deploy to Railway/Render with disk |
| Uploads fail | Read-only filesystem — use Vercel Blob or external storage |
| 404 on routes | Ensure `vercel.json` routes all paths to `server.js` |

---

## Checklist before going live

- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Set a random `SESSION_SECRET`
- [ ] Choose hosting: Vercel (needs storage migration) or Railway/Render (works as-is)
- [ ] Test `/admin` login and saving content
- [ ] Test image uploads
- [ ] Add custom domain (optional)
