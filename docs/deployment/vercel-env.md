# Vercel Environment Variables (T151)

> Configure these variables in Vercel → Project → Settings → Environment Variables before the first production deploy.

| Name | Scope | Source | Notes |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Production / Preview / Development | Supabase dashboard → Project URL | Exposed to the browser via Vite. |
| `VITE_SUPABASE_ANON_KEY` | Production / Preview / Development | Supabase dashboard → anon public key | Public key, safe for client use. |
| `OPENAI_API_KEY` | Production / Preview | OpenAI dashboard | Required by `api/ocr/recognize`. Keep secret. |
| `SUPABASE_URL` | Production / Preview | Same as above | Used server-side if we call Supabase REST from functions. Optional for MVP. |
| `SUPABASE_ANON_KEY` | Production / Preview | Same as above | Allows Edge functions to validate JWTs if needed. |

## Setup (CLI)

```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add OPENAI_API_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
# Repeat for preview / development as needed
```

Alternatively, use the Vercel dashboard UI and paste the values per scope.

Document the source of truth for secrets in 1Password / company vault; do not commit `.vercel` secrets to git.
