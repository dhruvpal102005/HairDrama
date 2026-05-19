# TaskHub Quick Start Guide

## Error: Missing Clerk Secret Key

You're seeing this error because the Clerk authentication keys are not set up yet. Follow these steps:

## Step 1: Create Clerk Account (FREE)

1. Go to https://clerk.com
2. Click "Start building for free"
3. Sign up with your email or GitHub
4. Verify your email

## Step 2: Create Application

1. After login, click "Create Application"
2. Name it: `TaskHub`
3. Enable these sign-in methods:
   - ✅ Google
   - ✅ GitHub
4. Click "Create Application"

## Step 3: Get Your API Keys

1. You'll see a screen with your keys
2. Copy the **Publishable Key** (starts with `pk_test_...`)
3. Copy the **Secret Key** (starts with `sk_test_...`)

## Step 4: Add Keys to .env.local

Open the file `.env.local` in the root directory and replace:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

With your actual keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abc123...
CLERK_SECRET_KEY=sk_test_xyz789...
```

## Step 5: Restart Development Server

1. Stop the server (Ctrl+C in terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

## Step 6: Test the Application

1. Open http://localhost:3000
2. You should see the landing page
3. Click "Sign Up" or "Sign In"
4. Clerk modal should open
5. Sign in with Google or GitHub

## What's Next?

After authentication works, you need to set up:

1. **Supabase Database** (for storing data)
   - Go to https://supabase.com
   - Create free project
   - Run migrations from `/migrations` folder

2. **Resend Email** (for notifications)
   - Go to https://resend.com
   - Get free API key

3. **Replicate AI** (for image generation)
   - Go to https://replicate.com
   - Get API token

4. **Backend Setup**
   - Install Python dependencies
   - Set up Redis
   - Configure backend `.env`

See `SETUP_GUIDE.md` for complete instructions.

## Common Issues

### Issue: "Module not found" errors
**Solution**: Run `npm install` to install dependencies

### Issue: Port 3000 already in use
**Solution**: 
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

### Issue: Clerk keys not working
**Solution**: 
- Make sure you copied the entire key
- No extra spaces before/after
- File is named exactly `.env.local`
- Restart the dev server after adding keys

## Need Help?

Check these files:
- `README.md` - Full project documentation
- `SETUP_GUIDE.md` - Complete setup instructions
- `ARCHITECTURE.md` - System architecture details
- `DEPLOYMENT.md` - Production deployment guide

## Quick Commands

```bash
# Install dependencies
npm install

# Start frontend (Next.js)
npm run dev

# Start backend (Flask) - in separate terminal
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py

# Start worker (for AI generation) - in separate terminal
cd backend
venv\Scripts\activate
python worker.py

# Start Redis (required for background jobs)
redis-server
```

## Minimal Setup to See Landing Page

If you just want to see the landing page without full setup:

1. Get Clerk keys (Steps 1-4 above)
2. Add to `.env.local`
3. Run `npm run dev`
4. Visit http://localhost:3000

That's it! The landing page will work without database or backend.

## Full Setup for Complete Functionality

For task management and AI generation to work, you need:
- ✅ Clerk (authentication) - **REQUIRED**
- ✅ Supabase (database) - **REQUIRED**
- ✅ Backend running (Flask API) - **REQUIRED**
- ✅ Redis + Worker (AI generation) - **REQUIRED**
- ⚠️ Resend (emails) - Optional for testing
- ⚠️ Replicate (AI) - Optional for testing (can mock)

Follow `SETUP_GUIDE.md` for complete setup.
