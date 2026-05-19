# TaskHub Setup Guide

Complete step-by-step guide to set up and run TaskHub locally and deploy to production.

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- Python 3.9+ installed
- Redis installed (for background jobs)
- Git installed
- Accounts created on:
  - Clerk (https://clerk.com) - Free
  - Supabase (https://supabase.com) - Free
  - Resend (https://resend.com) - Free tier
  - Replicate (https://replicate.com) - Pay-as-you-go with free credits

## Step 1: Clone and Install

```bash
# Clone repository
git clone <your-repo-url>
cd Assignment

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Step 2: Set Up Clerk Authentication

1. Go to https://clerk.com and create account
2. Create new application
3. In "Configure" → "SSO Connections":
   - Enable Google OAuth
   - Enable GitHub OAuth
4. Copy your keys:
   - Publishable Key: `pk_test_...`
   - Secret Key: `sk_test_...`
5. In "Webhooks":
   - Add endpoint: `https://your-backend-url/api/auth/sync`
   - Subscribe to: `user.created`, `user.updated`
   - Copy webhook secret

## Step 3: Set Up Supabase Database

1. Go to https://supabase.com and create project
2. Wait for project to be ready (~2 minutes)
3. Go to "Project Settings" → "API":
   - Copy Project URL
   - Copy `anon` `public` key
4. Go to "SQL Editor"
5. Click "New Query"
6. Copy contents of `migrations/001_initial_schema.sql`
7. Paste and click "Run"
8. Verify tables created in "Table Editor"

## Step 4: Set Up Resend Email

1. Go to https://resend.com and create account
2. Verify your email
3. Go to "API Keys"
4. Create new API key
5. Copy the key (starts with `re_...`)

## Step 5: Set Up Replicate AI

1. Go to https://replicate.com and create account
2. Go to account settings
3. Click "API Tokens"
4. Copy your token (starts with `r8_...`)

## Step 6: Configure Environment Variables

### Frontend (.env.local)
Create `.env.local` in root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
```

### Backend (.env)
Create `.env` in `backend/` directory:

```env
FLASK_ENV=development
FLASK_SECRET_KEY=your-random-secret-key-here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here

# Clerk
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# Resend
RESEND_API_KEY=re_your_key_here

# Replicate
REPLICATE_API_TOKEN=r8_your_token_here

# Redis
REDIS_URL=redis://localhost:6379

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 7: Start Redis

### macOS (with Homebrew)
```bash
brew install redis
brew services start redis
```

### Windows
Download from https://redis.io/download or use WSL

### Linux
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

## Step 8: Run the Application

Open 4 terminal windows:

### Terminal 1: Frontend
```bash
npm run dev
```

### Terminal 2: Backend API
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py
```

### Terminal 3: Background Worker
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python worker.py
```

### Terminal 4: Redis (if not running as service)
```bash
redis-server
```

## Step 9: Create First Admin User

1. Visit http://localhost:3000
2. Click "Sign Up"
3. Sign up with Google or GitHub
4. Go to Supabase dashboard
5. Open "Table Editor" → "users"
6. Find your user
7. Change `role` from `user` to `admin`
8. Refresh the app

## Step 10: Test the Application

1. As admin, create a task with a product image URL
2. Create a second user account (different email)
3. As admin, assign the task to the second user
4. Check email for task assignment notification
5. Log in as the second user
6. Open the task and start working
7. Generate all 8 images in AI Studio
8. Submit the task
9. Check admin email for submission notification
10. As admin, review and accept the task

## Production Deployment

### Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
```

### Deploy Backend to Render

1. Go to https://render.com
2. Create new "Web Service"
3. Connect GitHub repository
4. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
5. Add all environment variables
6. Create Redis instance on Render
7. Create background worker service:
   - Start Command: `python worker.py`

### Update Environment Variables

After deployment, update:
- `NEXT_PUBLIC_API_URL` to your Render backend URL
- `NEXT_PUBLIC_APP_URL` to your Vercel frontend URL
- Update Clerk webhook URL to production backend

## Troubleshooting

### Redis Connection Error
- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check REDIS_URL in .env

### Clerk Authentication Not Working
- Verify publishable and secret keys
- Check that OAuth providers are enabled
- Ensure webhook is configured

### Supabase Connection Error
- Verify URL and anon key
- Check that migrations ran successfully
- Ensure RLS policies are enabled

### AI Generation Failing
- Verify Replicate API token
- Check that you have credits
- Ensure background worker is running

### Email Not Sending
- Verify Resend API key
- Check that sender email is verified
- Look for errors in backend logs

## Support

For issues, check:
1. Backend logs in terminal
2. Browser console for frontend errors
3. Supabase logs in dashboard
4. Redis logs

## Next Steps

1. Add your pearl jewelry test image
2. Generate the 8 sample images
3. Save them in `generated_samples/` folder
4. Create video walkthrough
5. Push to GitHub
6. Submit assignment

Good luck! 🚀
