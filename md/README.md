## Environment Variables

Create a `.env.local` file in the project root with the following keys:

```env
SCRAPERAPI_KEY=your_scraperapi_key_here
NUMBEO_API_KEY=your_numbeo_api_key_here
AMADEUS_API_KEY=your_amadeus_api_key_here
AMADEUS_API_SECRET=your_amadeus_api_secret_here
YOUTUBE_API_KEY=your_youtube_api_key_here
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
SERPAPI_KEY=your_serpapi_key_here
SENDGRID_API_KEY=your_sendgrid_key_here
FROM_EMAIL=your_verified_sendgrid_email@domain.com
QLOO_API_KEY=your_qloo_api_key_here
QLOO_API_URL=https://api.qloo.com
OPENAI_API_KEY=your_openai_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** Never commit your `.env.local` file to version control. See `.gitignore`.

## SendGrid Setup for PDF Reports

To enable PDF report emailing functionality:

1. **Create a SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com)
2. **Get API Key**: 
   - Go to Settings → API Keys
   - Create a new API key with "Full Access" or "Mail Send" permissions
   - Copy the API key to `SENDGRID_API_KEY` in your `.env.local`
3. **Verify Sender Email**:
   - Go to Settings → Sender Authentication
   - Verify the email address you want to send from
   - Add this email to `FROM_EMAIL` in your `.env.local`
4. **Test the functionality**: Users can now receive personalized PDF travel reports via email

## Qloo API Setup for Taste Vector Generation

The application integrates with Qloo's API for advanced taste profile generation:

1. **Get Qloo API Access**: Contact Qloo to obtain API credentials
2. **Configure Environment Variables**:
   - `QLOO_API_KEY`: Your Qloo API key
   - `QLOO_API_URL`: Qloo API base URL (typically `https://api.qloo.com`)
3. **Fallback Behavior**: If Qloo API is not configured or fails, the system automatically falls back to an enhanced mock system
4. **Integration Status**: Check the API response metadata for `apiSource` to see if real Qloo API or mock system was used
> This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
