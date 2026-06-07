# Personal Webpage

A personal portfolio site with a **database-backed admin panel** — update your info and upload photos through a web UI, no HTML editing required.

## Features

- Public portfolio page (profile, education, work, experience, photo gallery, contact)
- Admin dashboard at `/admin` for easy content management
- SQLite database — no separate database server needed
- Image upload for profile photo and gallery
- Modern, responsive design

## Quick Start

```bash
# Option 1: use start script (recommended)
chmod +x start.sh
./start.sh

# Option 2: manual
npm install
cp .env.example .env   # edit ADMIN_PASSWORD
npm start
```

| URL | Purpose |
|-----|---------|
| http://localhost:8637 | Public portfolio page |
| http://localhost:8637/admin | Admin panel |

**Default admin password:** `admin123` (change it in `.env`)

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
├── db/database.js         SQLite schema & queries
├── routes/                API endpoints
├── public/
│   ├── index.html         Public page shell
│   ├── css/styles.css     Public site styles
│   ├── js/app.js          Renders page from API
│   ├── admin/             Admin dashboard UI
│   ├── images/            Default placeholder images
│   └── uploads/           Your uploaded photos
├── data/site.db           SQLite database (auto-created)
└── .env                   Configuration
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

- **Local / VPS / Railway / Render:** use `./start.sh`
- **Vercel:** see [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) (includes limitations and migration options)

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

**Note:** `.env` and `data/site.db` are gitignored — set `ADMIN_PASSWORD` and `SESSION_SECRET` again on any server you deploy to.
