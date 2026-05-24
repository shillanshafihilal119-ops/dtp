# DTP Paper Service

A web app for teachers to submit handwritten Urdu/Kashmiri paper requests and receive formatted final PDFs.

## Features

- Teacher request form
- Image upload
- Admin dashboard
- Status tracking
- Preview image upload
- Final PDF upload
- Payment lock
- Request tracking by phone or request ID
- Admin login protection

## Tech Stack

- Next.js
- Supabase
- Vercel
- Tailwind CSS

## Routes

- `/` — Submit paper request
- `/track` — Track request
- `/admin-login` — Admin login
- `/admin` — Admin dashboard

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ADMIN_PASSWORD=