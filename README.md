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

The application uses custom OTP authentication via Supabase Edge Functions. No additional redirect URL configuration is required.

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Troubleshooting

### OTP code not received

Check your spam folder or verify that the Resend API key is configured correctly in your Supabase Edge Functions environment.

## Features

- OTP authentication (6-digit code via email)
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
