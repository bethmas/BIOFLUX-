# BioFlux

This project has a React/Vite frontend and an Express/TypeScript backend.

## Cloudflare deployment

### Frontend (Cloudflare Pages)
1. Push this repository to GitHub.
2. Create a Cloudflare Pages project connected to the repo.
3. Set the build output directory to `frontend/dist`.
4. Set the build command to `cd frontend && npm install && npm run build`.
5. Add these environment variables in Cloudflare Pages:
   - `VITE_API_URL` = your public backend URL

### Backend
For the API, you have two practical options:
1. Deploy the Express backend to Railway / Render / Fly.io / a VPS.
2. If you want full serverless, we can refactor this app to Cloudflare Workers later.

### Important note
The current backend uses MySQL and Express, so Cloudflare Pages alone will only host the frontend. The API needs a separate host.
