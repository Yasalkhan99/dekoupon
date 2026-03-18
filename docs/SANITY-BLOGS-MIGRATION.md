# Sanity Studio mein existing blogs kyun nahi dikhte?

Aapke **pehle se banaye hue blogs** (Admin panel `/admin` se ya file se) **Sanity mein save nahi hote** — wo **data/blog.json** (aur agar Supabase use ho to Supabase) mein hain.

- **Sanity Studio** sirf wohi documents dikhata hai jo **Sanity dataset** mein hain.
- Isliye Studio mein sirf wo documents dikhenge jo aapne Sanity Studio se directly create kiye ya jo migration se import kiye.

## Solution: blog.json → Sanity import

Saare existing blogs ko Sanity mein laane ke liye migration script chalao:

1. **Sanity project ID** (`.env` / `.env.local` mein `NEXT_PUBLIC_SANITY_PROJECT_ID` — jo Studio ke liye use ho raha hai).
2. **Sanity API token** (write access):  
   [sanity.io/manage](https://www.sanity.io/manage) → apna project → **API** → **Tokens** → **Add token** → **Editor**.
3. **Env set karke script run karo:**

```bash
# PowerShell (Windows)
$env:NEXT_PUBLIC_SANITY_PROJECT_ID = "your-project-id"
$env:SANITY_API_TOKEN = "your-editor-token"
node scripts/migrate-to-sanity.js
```

```bash
# Bash / Mac / Linux
export NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
export SANITY_API_TOKEN=your-editor-token
node scripts/migrate-to-sanity.js
```

4. Script `data/blog.json` ke saare posts ko Sanity mein create karega (duplicate slug wale skip). Uske baad **Sanity Studio** refresh karo — saare imported blogs list mein dikhne chahiye.

## Dataset check

Agar phir bhi nahi dikhen: `.env` mein `NEXT_PUBLIC_SANITY_DATASET` check karo. Script default `production` use karti hai; agar Studio kisi aur dataset (e.g. `development`) use kar raha hai to same dataset script ko bhi dena hoga:

```bash
$env:NEXT_PUBLIC_SANITY_DATASET = "production"   # ya jo bhi Studio use kare
```
