# Personal Webpage

A personal portfolio site with a **database-backed admin panel** — update your info and upload photos through a web UI, no HTML editing required.

Uses **Neon PostgreSQL** for storage (works on Vercel serverless and locally).

## Features

- Public portfolio page (profile, education, work, experience, photo gallery, contact)
- Admin dashboard at `/admin` for easy content management
- Neon PostgreSQL database (cloud, serverless-friendly)
- Image upload for profile photo and gallery
- Modern, responsive design

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL (Neon), ADMIN_PASSWORD, SESSION_SECRET

# 3. Start the server
./start.sh
```

**Get a free Neon database:** [neon.tech](https://neon.tech) → New Project → copy the **pooler** connection string into `DATABASE_URL`. Required for both local dev and production.

Test the connection:

```bash
npm run probe-db
```

If startup fails with `ETIMEDOUT` or `fetch failed`, Node cannot reach Neon (psql may still work). **`./start.sh` auto-starts local Docker Postgres on port 5434** and uses it for the session. To force local DB:

```bash
USE_LOCAL_DB=1 ./start.sh
```

Optional `.env` pin (keeps `DATABASE_URL` for Neon sync):

```env
RUNTIME_DATABASE_URL=postgresql://personal:personal@localhost:5434/personal_web
DB_DRIVER=pg
```

| URL | Purpose |
|-----|---------|
| http://localhost:8637 | Public portfolio page |
| http://localhost:8637/admin | Admin panel |

**Admin password:** set only in `ADMIN_PASSWORD` in `.env` (local) or Vercel env vars — not stored in the database.

## How to Update Content

1. Go to **http://localhost:8637/admin**
2. Sign in with your admin password
3. Use the sidebar to edit each section:

| Section | What you can do |
|---------|-----------------|
| **Profile** | Name, tagline, intro, upload portrait photo |
| **About** | Bio, location, focus, current activity |
| **Education** | Add/edit/delete study entries |
| **Work** | Add/edit/delete job history |
| **Experience** | Projects, milestones, skills tags |
| **Gallery** | Upload photos, set captions and layout (normal/wide/tall) |
| **Contact** | Email, LinkedIn, GitHub, or any link |

4. Click **Save** on each section — changes appear on the public site immediately

## Upload Pictures

- **Profile photo:** Admin → Profile → Upload Photo → Save Profile
- **Gallery photos:** Admin → Gallery → Upload Photo

Uploaded images are stored in `public/uploads/`. Supported formats: JPG, PNG, WebP, GIF, SVG (max 10 MB).

## Project Structure

```
personal-webpage/
├── server.js              Express server
├── db/database.js         Neon PostgreSQL schema & queries
├── routes/                API endpoints
├── public/
│   ├── index.html         Public page shell
│   ├── css/styles.css     Public site styles
│   ├── js/app.js          Renders page from API
│   ├── admin/             Admin dashboard UI
│   ├── images/            Default placeholder images
│   └── uploads/           Uploaded photos (local dev)
├── .env                   DATABASE_URL, secrets
└── start.sh               Start script
```

## Development

```bash
npm run dev    # auto-restart on file changes (Node --watch)
```

## Security Notes

- Change `ADMIN_PASSWORD` in `.env` before deploying
- Set a strong random `SESSION_SECRET`
- Do not expose the admin panel publicly without HTTPS and a strong password

## Deploy

- **Vercel + Neon:** see [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)
- **Railway / Render / VPS:** use `./start.sh` with `DATABASE_URL` set

## Link to GitHub

The project is a git repo. To push it to GitHub:

```bash
# 1. Create a new empty repo on GitHub (no README) — e.g. personal-webpage

# 2. Commit locally
git commit -m "Initial commit: personal webpage with admin panel"

# 3. Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/personal-webpage.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. Use SSH if you prefer:

```bash
git remote add origin git@github.com:YOUR_USERNAME/personal-webpage.git
```

**Note:** `.env` is gitignored — set `DATABASE_URL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` on any server you deploy to.
