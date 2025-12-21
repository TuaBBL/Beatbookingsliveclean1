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

#### Email Service Setup (Resend)

The authentication system requires Resend for sending verification emails. Follow these steps:

1. Create a Resend account at [resend.com](https://resend.com)
2. Get your API key from the Resend dashboard
3. Verify your sending domain or use the default test domain
4. Configure the API key in your Supabase project:
   - Go to your Supabase project dashboard
   - Navigate to **Edge Functions** → **Secrets**
   - Add the following secret:
     - `RESEND_API_KEY`: Your Resend API key

Optional environment variables:
- `RESEND_FROM_EMAIL`: Custom sender email (default: "BeatBookingsLive <info@beatbookingslive.com>")

**Important:** Without the Resend API key configured, users will not be able to log in as verification emails cannot be sent.

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Troubleshooting

### OTP code not received

If you're not receiving verification codes, check the following:

1. **Resend API Key:** Verify the `RESEND_API_KEY` is set in Supabase Edge Functions secrets
2. **Spam folder:** Check your email spam/junk folder
3. **Domain verification:** Ensure your sending domain is verified in Resend
4. **API limits:** Check your Resend account for any rate limits or quota issues
5. **Edge Function logs:** View Supabase Edge Function logs for detailed error messages
6. **Email validity:** Ensure you're using a valid email address

### Authentication errors

If you see "Email service is not configured" error:
- The `RESEND_API_KEY` environment variable is missing
- Configure it in Supabase project settings under Edge Functions → Secrets

If you see "Failed to send verification email" error:
- Check Supabase Edge Function logs for detailed Resend API errors
- Verify your Resend account is active and has sending credits
- Ensure the sender email domain is verified

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
