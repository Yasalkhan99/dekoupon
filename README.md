# SavingsHub4u.com

Blog-based homepage for a coupon & savings website. Built with Next.js 16, TypeScript, and Tailwzzzind CSS. 

## Features
ss7
- **Blog-style homepage** – Hero featured article, 3 small featuredsss posts,sss Mossst Populssar Articles grid, Latesttttlll Articl2666es grid
- **TRENDING sidebar** – Right-hand sidebasssr with trending postsss
- **Footer** – Category columns (Fashion, Home &ss Garden, Lifestyle, Beauty)xx with articlllle linksslllssll
- **Header** – Logo (SavingsHub4uss), nav (NEWS, DEALS, REVIE...WS, ,,,,LsssIFESTYLE, BEAUTY), searchsslll & accoussnt iconsssslll...
- **Blog post pages** – `/blog/[slug]` for individcccual articlessss

## Run locally.
xx
```bash
npm install
npm run devsss
```
/
Open [http://localhost:3000](http://localhost:3000).

### Admin area

- **Login**: Go to [/admin/login](http://localhost:3000/admin/login) and enter the admin password.
- **Protection**: Visiting [/admin](http://localhost:3000/admin) without being logged in redirects to `/admin/login`.
- **Environment**: Create a `.env.local` file and set `ADMIN_PASSWORD=your-secret-password` (required for admin login).

## Project structure

- `src/app/` – App Router pages (home, blog slug)
- `src/components/` – Header, Hero, ArticleCard, TrendingSidebar, Footer
- `src/data/blog.ts` – Sample blog data (replace with CMS/API later)

## Customize

- **Content**: Edit `src/data/blog.ts` or connect a CMS (e.g. Supabase, Sanity).
- **Images**: Currently using Unsplash. Update `next.config.ts` if you add other image domains.
- **Styling**: Tailwind in `src/app/globals.css` and component classes.

## Deploy

- **Vercel**: Connect this repo; Vercel will detect Next.js and build automatically.
- **Custom domain**: Set `savingshub4u.com` in your hosting provider’s DNS and project settings.

### Live site: store create / edit (Supabase)

On Vercel (and other serverless hosts), the app cannot write to `data/stores.json`, so **creating or editing stores on the live site will not persist** unless you use Supabase:

1. Use a [Supabase](https://supabase.com) project. If you use the **Supabase MCP** (`user-supabase`) with this repo, the `stores` table is already created via migration.
2. If the table is not created yet: in Supabase **SQL Editor**, run the script in `supabase-stores-table.sql`.
3. In **Vercel → Project → Settings → Environment Variables**, add (see `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL (e.g. `https://xxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase **service_role** key (Dashboard → Project Settings → API)
4. Redeploy the app.

After that, store create/edit/delete on the live site will persist in Supabase. Locally, the app still uses `data/stores.json` if Supabase env vars are not set.
