# MinuteMan Tickets

![UMass Minutemen logo](./public/images/b05cfb_UMass_logo.jpg.webp)

MinuteMan Tickets is a campus-only ticket marketplace for UMass Amherst students. It provides a streamlined way to list, discover, and manage tickets for basketball games, concerts, and other campus events. Authentication, password recovery, and session management are handled by Supabase, while the UI is built with the Next.js App Router and Tailwind CSS.

## Features

- **UMass-only access** – the app is designed for @umass.edu addresses; configure Supabase to block non-UMass sign ups.
- **Supabase authentication** – sign up, email verification, login, logout, password reset, and password update flows.
- **Events dashboard** – responsive grid of events with search input, buy/sell toggles, and ticket cards fed by the `events` table.
- **Protected routes** – authenticated pages use Supabase middleware to persist sessions and redirect anonymous users to the login screen.
- **Reusable UI components** – shared card, button, input, and form elements powered by Tailwind CSS 4 and Radix primitives.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Supabase (auth + Postgres data)
- Tailwind CSS 4 / tailwind-merge / clsx
- Radix UI primitives
- TypeScript

## Project Structure

```
app/
  auth/               Auth routes (login, sign-up, password flows)
  events/             Main events dashboard (client page)
  protected/          Example authed-only page
  api/
  ui/                 Tailwind/Radix UI primitives
lib/
  supabase/           Browser + server Supabase clients and middleware
  utils.ts            Tailwind class combiner helper
public/images/        Campus imagery & event artwork
```

## Key Flows

- **Sign Up** (`/auth/sign-up`) – creates a Supabase auth user; redirect target is `/protected` once the email link is confirmed.
- **Login** (`/auth/login`) – authenticates existing students; on success users land on `/events`.
- **Forgot Password / Update Password** – full email-based password reset using Supabase redirect URLs.
- **Events Dashboard** (`/events`) – client component that calls `getEvents()` to read from Supabase, renders `EventCard` components, and includes logout.
- **Session Middleware** (`proxy.ts`) – wraps all routes and redirects anonymous visitors to the login page.

