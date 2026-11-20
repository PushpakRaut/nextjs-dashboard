# Next.js Invoice Dashboard

Frontend for [spring-boot-invoice-api](https://github.com/PushpakRaut/spring-boot-invoice-api). Sign up, add customers, create multi-line invoices, and track what's paid vs outstanding.

**Stack:** Next.js 15.5 (App Router) · React 19 · TypeScript · Tailwind CSS · REST + JWT

## Features
- Register / sign in against the Spring Boot API (JWT)
- Summary cards: invoice count, outstanding, paid
- Create customers and invoices with multiple line items and a live total
- Status workflow (Draft → Sent → Paid), filter by status, delete with confirmation
- Expired session redirects back to sign-in
- Coral design: warm paper ledger, mono figures, "Paid" pressed in coral; responsive, labelled fields, visible focus

## Run locally
1. Start the API (see its README) on `http://localhost:8080`
2. Then:
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Deploy (free, no credit card)
The app is exported as static files (`npm run build` writes `out/`). On [Render](https://render.com) choose *New → Blueprint* with this repo: `render.yaml` creates a free static site, sets `NEXT_PUBLIC_API_URL` and adds security headers. Then add the site's URL to the API's `CORS_ORIGINS`. Any static host (Vercel, Netlify, GitHub Pages) works the same way.

## Configuration
| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the invoice API | `http://localhost:8080` |

## Structure
```
src/lib/api.ts             Typed fetch wrapper, token storage, error handling
src/app/page.tsx           Sign in / register
src/app/dashboard/page.tsx Summary, forms, invoice table
```
