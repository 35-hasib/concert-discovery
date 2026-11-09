# Concert Discovery

A concert tour discovery platform with a public, SEO-focused React site and a separate authenticated admin dashboard for publishing announcements and TicketNetwork schedules.

## Architecture

```text
backend/   Express + Prisma API, authentication, uploads, sitemap and widget documents
frontend/  Public Vite + React site
admin/     Protected Vite + React dashboard
```

The apps run independently:

| App | Development URL | Production output |
| --- | --- | --- |
| Backend API | `http://localhost:4100` | `node src/server.js` |
| Public site | `http://localhost:5173` | `frontend/dist/` |
| Admin dashboard | `http://localhost:5174` | `admin/dist/` |

## Features

### Public site
- Homepage with featured tours, latest announcements, genres and search
- Searchable, filterable, sortable and paginated tour directory
- Rich tour pages with table of contents, galleries, sharing and related posts
- Sandboxed TicketNetwork concert widgets
- Dynamic metadata, Open Graph, JSON-LD, sitemap and robots
- Responsive layouts, accessible navigation, loading and empty states

### Admin dashboard
- JWT authentication with protected routes, login rate limiting and session restore
- Dashboard with content stats and recent edits
- Blog CRUD with drafts, publishing, featured posts and preview
- Tiptap editor with headings, lists, links, images, quotes and alignment
- Image uploads processed with `sharp` and stored in Cloudinary: raster images become WebP, favicons become 64x64 PNG
- Theme, logo, favicon, social links and default SEO settings
- Widget preview and draft preview without exposing drafts publicly

## Tech stack

- Backend: Node.js, Express 4, Prisma 6, PostgreSQL
- Public site and admin: React 18, Vite 5, React Router 6, Tailwind CSS 3
- Auth and validation: JWT, `bcryptjs`, Zod
- Content and media: Tiptap 2, `sanitize-html`, `sharp`, `multer`
- Icons: `lucide-react`

## Quick start

Requirements: Node.js 20+, npm, PostgreSQL 14+ and a Cloudinary account.

1. Install dependencies:

```bash
npm run install:all
```

2. Create the environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp admin/.env.example admin/.env
```

3. Create the database and update `backend/.env` with the correct `DATABASE_URL`, `JWT_SECRET`, admin credentials and Cloudinary API credentials:

```bash
createdb concert_discovery
```

4. Apply the database migration and seed the demo content:

```bash
npm run db:deploy
npm run db:seed
```

5. Start all three apps:

```bash
npm run dev
```

Open `http://localhost:5173` for the public site and `http://localhost:5174` for the admin dashboard.

If PostgreSQL is not already running, start the local development instance from the project root:

```bash
.postgres/usr/lib/postgresql/18/bin/pg_ctl \
  -D .postgres/data \
  -l .postgres/postgres.log \
  -o "-p 5432 -k /tmp" \
  start
```

### Seeded credentials

The seed script reads these values from `backend/.env`:

## Environment variables

### `backend/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | API port, defaults to `4100`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `JWT_SECRET` | Yes | Long random secret used to sign admin tokens. |
| `JWT_EXPIRES_IN` | No | Token lifetime, defaults to `7d`. |
| `CORS_ORIGIN` | Yes | Comma-separated public and admin origins. |
| `SITE_URL` | Yes | Public site URL used for canonical URLs and sitemap entries. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name used for image storage. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary server-side API key. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary server-side API secret. Never expose this to client apps. |
| `CLOUDINARY_FOLDER` | No | Root upload folder, defaults to `concert-discovery`. |
| `ADMIN_NAME` | Seed only | Display name for the seeded administrator. |
| `ADMIN_EMAIL` | Seed only | Login email for the seeded administrator. |
| `ADMIN_PASSWORD` | Seed only | Password for the seeded administrator. |

### `frontend/.env` and `admin/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Backend API base, e.g. `http://localhost:4100/api`. |
| `VITE_SITE_URL` | Yes | Public site base used for links and widgets. |

### `frontend` Vercel project (server-side SEO renderer)

The `frontend/api/seo.mjs` serverless function prerenders route-specific SEO HTML for public
routes (`/`, `/tours`, `/tours/:slug`, `/contact`, `/privacy`, `/terms`) together with the
rewrites in `frontend/vercel.json`. Published tour pages are served with `index, follow` in the
initial HTML; unknown or draft slugs get HTTP 404 with an `X-Robots-Tag: noindex` header.
Temporary backend failures return HTTP 503 with `Retry-After` (never a 200 error shell), so search
engines retry instead of recording a soft 404. The function must keep the `.mjs` extension: Vercel
only deploys `.js`, `.mjs`, `.ts` and `.mts` files as serverless functions.

| Variable | Required | Purpose |
| --- | --- | --- |
| `BACKEND_ORIGIN` | No | Backend origin used by the SEO renderer, e.g. `https://concert-discovery.onrender.com`. Defaults to the Render URL. |
| `SITE_URL` | No | Canonical site base used in the server-rendered `rel=canonical` and `og:url` tags. Falls back to the request host when unset. Should match `SITE_URL` in `backend/.env`. |

To verify the renderer output locally after `npm --prefix frontend run build`:

```bash
node frontend/scripts/test-seo.cjs
```

Generate a production JWT secret with:

```bash
openssl rand -base64 32
```

## Scripts

Run these from the project root:

```bash
npm run dev          # backend + public site + admin with hot reload
npm run dev:api      # backend only
npm run dev:site     # public site only
npm run dev:admin    # admin only
npm run build        # build public site and admin
npm run preview      # run backend and preview both production builds
npm run typecheck    # TypeScript checks for public site and admin
npm run install:all  # install root, backend, frontend and admin dependencies
```

Database scripts proxy to the backend:

```bash
npm run db:deploy    # apply committed migrations
npm run db:migrate   # create and apply a development migration
npm run db:push      # sync schema without a migration
npm run db:generate  # regenerate Prisma Client
npm run db:seed      # seed admin, settings and demo content
npm run db:studio    # open Prisma Studio
```

## Demo content

The idempotent seed creates:

- the administrator account and default site settings
- six demo tour announcements: five published and one draft
- local SVG tour posters in `backend/public/seed/`
- a working demo TicketNetwork-style schedule on the Neon Harbor post

Existing records are not overwritten when the seed is rerun. Replace the demo posts before launch.

## Widget integration

Each blog drives its own TicketNetwork schedule from structured settings; raw embed code is optional.

1. In the admin editor, enable **Concert schedule**.
2. Enter the artist/performer search query. Optionally set an end date, affiliate URL and events per page; the site default affiliate is used when the URL is blank.
3. Preview the widget and save or publish the post. The public page loads the schedule from `GET /embed/widget/:slug` inside an iframe.
4. To use a complete TicketNetwork embed instead, paste it into **Paste full TicketNetwork embed code**. A pasted embed is used exactly as supplied and takes priority over the generated schedule settings.

Generated schedules use a container id derived from the blog id, so every tour gets an isolated widget and filter state. Legacy TicketNetwork embeds continue to work, and their artist, date, affiliate and page size are derived automatically when the post is opened in the admin editor.

The iframe uses `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads"` without `allow-same-origin`. The widget document includes a CSP that permits the required TicketNetwork assets while keeping third-party scripts isolated from both app origins.

## Security notes

- Admin routes use Bearer JWTs stored in `localStorage`; no admin session cookie is shared with the public site.
- Admin API routes verify the token and reject missing or invalid credentials.
- Login attempts are rate limited per IP.
- Article HTML is sanitized on save.
- Widget code is isolated in a sandboxed iframe and is never injected into the main app document.
- Uploads accept raster images only and are re-encoded with `sharp`; SVG uploads are rejected.
- Processed images are uploaded directly to Cloudinary using signed server-side requests. Credentials stay in `backend/.env` and are never exposed to either frontend.
- Legacy files already stored in `backend/storage/uploads/` remain available through the validated local media route.
- Drafts and future-dated posts are excluded from public queries, sitemap and widget routes.

## Deployment

1. Provision PostgreSQL and Cloudinary, then set the production values in `backend/.env`, `frontend/.env` and `admin/.env`. Uploads require `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`.
2. Install dependencies with `npm run install:all`.
3. Apply migrations with `npm run db:deploy`, and optionally seed demo content once with `npm run db:seed`.
4. Build the frontend apps with `npm run build`.
5. Start the API with `npm run dev:api` equivalents in production, and serve `frontend/dist/` and `admin/dist/` from a static host or reverse proxy.

`npm run preview` is intended for local production-build checks. Use a production static server or CDN in real deployments.

New uploads are stored in Cloudinary, so the API no longer needs a persistent uploads volume. Keep `backend/storage/uploads/` only if you need to continue serving images uploaded before the Cloudinary migration.

Create a migration when the schema changes, then commit and apply it in each environment:

```bash
npm run db:migrate -- --name describe_change
npm run db:deploy
```

## Project structure

```text
backend/
  prisma/               schema, migrations and seed
  public/seed/          demo tour posters
  src/routes/           auth, blogs, settings, admin, media, widgets, content
  src/services/         uploads, sanitization and widget documents
  storage/uploads/      legacy local uploads only
frontend/
  src/components/       public UI, widgets and gallery
  src/pages/            home, tours, tour detail, legal and contact
  src/lib/              API, settings, SEO and formatting helpers
admin/
  src/components/       admin shell, editor, forms and media pickers
  src/pages/            login, dashboard, blogs, preview and settings
  src/lib/              API, validation, sanitization and types
```
