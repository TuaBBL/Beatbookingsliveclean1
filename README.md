# BeatBookingsLive

A platform connecting artists with venues and booking opportunities.

## Setup

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Supabase Configuration

#### Required: Configure Redirect URLs for Magic Link Authentication

The application uses magic link authentication. You **must** whitelist your redirect URLs in Supabase:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication → URL Configuration**
4. Add the following URLs to the **Redirect URLs** list:
   - For local development: `http://localhost:5173/auth-callback`
   - For local development (alt): `http://127.0.0.1:5173/auth-callback`
   - For WebContainer: Your current WebContainer URL + `/auth-callback`
   - For production: Your production domain + `/auth-callback`

5. Set the **Site URL** to your main application URL
6. Click **Save**

**Note:** WebContainer URLs change each session and include random identifiers. You'll need to update the redirect URL when starting a new development session in WebContainer environments.

#### Example Redirect URL Patterns

- Local: `http://localhost:5173/auth-callback`
- WebContainer: `https://[random-id].local-credentialless.webcontainer-api.io/auth-callback`
- Production: `https://yourdomain.com/auth-callback`

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Troubleshooting

### "Error sending magic link email" (500 error)

This occurs when the redirect URL is not whitelisted in Supabase. The error message will display the current redirect URL that needs to be added. Follow the Supabase Configuration steps above to resolve this.

### Magic link doesn't redirect properly

Ensure your Site URL is configured in Supabase Authentication settings and matches your application's base URL.

## Features

- Magic link authentication (passwordless)
- Artist profiles and discovery
- Venue listings
- Booking management
- User dashboard

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase (Authentication & Database)
- React Router
