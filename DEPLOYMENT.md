# TaskHub Deployment Guide

Complete guide for deploying TaskHub to production.

## Prerequisites

- GitHub account
- Vercel account (free)
- Render account (free)
- All service accounts set up (Clerk, Supabase, Resend, Replicate)

## Step 1: Prepare Repository

```bash
# Ensure all code is committed
git add .
git commit -m "Ready for deployment"

# Push to GitHub
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Step 2: Deploy Database (Supabase)

Supabase is already hosted, but ensure:

1. Migrations are run
2. RLS policies are enabled
3. Connection pooling is configured
4. Backup is enabled (automatic in Supabase)

## Step 3: Deploy Backend to Render

### 3.1 Create Web Service

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `taskhub-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Instance Type**: Free

### 3.2 Add Environment Variables

In Render dashboard, add:

```
FLASK_ENV=production
FLASK_SECRET_KEY=<generate-random-32-char-string>
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-anon-key>
CLERK_SECRET_KEY=<your-clerk-secret>
CLERK_WEBHOOK_SECRET=<your-clerk-webhook-secret>
RESEND_API_KEY=<your-resend-key>
REPLICATE_API_TOKEN=<your-replicate-token>
REDIS_URL=<will-add-after-redis-setup>
NEXT_PUBLIC_APP_URL=<will-add-after-frontend-deploy>
```

### 3.3 Create Redis Instance

1. In Render dashboard, click "New +" → "Redis"
2. Configure:
   - **Name**: `taskhub-redis`
   - **Region**: Same as web service
   - **Plan**: Free
3. After creation, copy the "Internal Redis URL"
4. Add to web service environment variables as `REDIS_URL`

### 3.4 Create Worker Service

1. Click "New +" → "Background Worker"
2. Connect same repository
3. Configure:
   - **Name**: `taskhub-worker`
   - **Region**: Same as web service
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python worker.py`
4. Add same environment variables as web service

### 3.5 Deploy

Click "Create Web Service" - deployment will start automatically.

Wait for deployment to complete (~5 minutes).

Copy your backend URL: `https://taskhub-api.onrender.com`

## Step 4: Deploy Frontend to Vercel

### 4.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 4.2 Login to Vercel

```bash
vercel login
```

### 4.3 Configure Environment Variables

Create `.env.production` in root:

```env
NEXT_PUBLIC_API_URL=https://taskhub-api.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
```

### 4.4 Deploy

```bash
# Deploy to production
vercel --prod
```

Follow prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **taskhub**
- Directory? **./
- Override settings? **N**

### 4.5 Add Environment Variables in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 4.6 Redeploy

```bash
vercel --prod
```

Copy your frontend URL: `https://taskhub.vercel.app`

## Step 5: Update Service Configurations

### 5.1 Update Clerk

1. Go to Clerk dashboard
2. Update webhook URL:
   - Old: `http://localhost:5000/api/auth/sync`
   - New: `https://taskhub-api.onrender.com/api/auth/sync`
3. Update allowed origins:
   - Add: `https://taskhub.vercel.app`

### 5.2 Update Backend Environment

In Render dashboard, update:
```
NEXT_PUBLIC_APP_URL=https://taskhub.vercel.app
```

Redeploy backend service.

### 5.3 Update Vercel Configuration

Update `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://taskhub-api.onrender.com/api/:path*"
    }
  ]
}
```

Commit and redeploy:
```bash
git add vercel.json
git commit -m "Update API URL"
git push
vercel --prod
```

## Step 6: Verify Deployment

### 6.1 Test Frontend

1. Visit your Vercel URL
2. Verify landing page loads
3. Test sign in with Google/GitHub
4. Check that you're redirected to dashboard

### 6.2 Test Backend

```bash
# Health check
curl https://taskhub-api.onrender.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 6.3 Test Full Flow

1. Sign in as admin (update role in Supabase)
2. Create a task
3. Create second user account
4. Assign task to user
5. Check email notification
6. Sign in as user
7. Start task
8. Generate one test image
9. Verify generation works
10. Submit task
11. Check admin email
12. Accept task as admin

## Step 7: Custom Domain (Optional)

### Frontend Domain

1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your domain
3. Update DNS records as instructed
4. Wait for SSL certificate

### Backend Domain

1. In Render dashboard, go to "Settings" → "Custom Domain"
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records
4. Update `NEXT_PUBLIC_API_URL` in Vercel

## Step 8: Monitoring Setup

### Render Monitoring

1. Enable "Health Check Path": `/api/health`
2. Set up alerts for:
   - Service down
   - High memory usage
   - High CPU usage

### Vercel Monitoring

1. Go to "Analytics" tab
2. Monitor:
   - Page views
   - Response times
   - Error rates

### Supabase Monitoring

1. Go to "Database" → "Logs"
2. Monitor:
   - Query performance
   - Connection count
   - Error logs

## Step 9: Backup Strategy

### Database Backups

Supabase automatically backs up daily. To manually backup:

1. Go to Supabase dashboard
2. "Database" → "Backups"
3. Click "Create backup"

### Code Backups

Ensure GitHub repository is:
- Private (for security)
- Has branch protection on `main`
- Has regular commits

## Step 10: Performance Optimization

### Frontend

1. Enable Vercel Analytics
2. Monitor Core Web Vitals
3. Optimize images with Next.js Image
4. Enable compression

### Backend

1. Enable Render auto-scaling (paid plan)
2. Add Redis caching for frequent queries
3. Optimize database queries
4. Monitor response times

### Database

1. Add indexes for slow queries
2. Enable connection pooling
3. Monitor query performance
4. Regular VACUUM ANALYZE

## Troubleshooting

### Backend Not Starting

Check Render logs:
```bash
# In Render dashboard, go to "Logs"
```

Common issues:
- Missing environment variables
- Redis connection failed
- Supabase connection failed

### Frontend Build Failing

Check Vercel logs:
```bash
vercel logs
```

Common issues:
- TypeScript errors
- Missing environment variables
- Build timeout

### AI Generation Not Working

Check:
1. Replicate API token is valid
2. Worker service is running
3. Redis connection is working
4. Check worker logs in Render

### Emails Not Sending

Check:
1. Resend API key is valid
2. Sender email is verified
3. Check backend logs for errors

## Scaling Considerations

### Free Tier Limits

**Vercel**:
- 100 GB bandwidth/month
- Unlimited requests
- 100 GB-hours compute

**Render**:
- 750 hours/month (enough for 1 service)
- Sleeps after 15 min inactivity
- 512 MB RAM

**Supabase**:
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth

**Resend**:
- 3,000 emails/month
- 100 emails/day

**Replicate**:
- Pay-as-you-go
- ~$0.01 per image

### Upgrading

When you hit limits:

1. **Vercel Pro** ($20/month):
   - More bandwidth
   - Better performance
   - Team features

2. **Render Starter** ($7/month):
   - No sleep
   - More RAM
   - Better performance

3. **Supabase Pro** ($25/month):
   - 8 GB database
   - 100 GB storage
   - Daily backups

## Security Checklist

- [ ] All environment variables are set
- [ ] HTTPS is enabled (automatic)
- [ ] Clerk webhook secret is configured
- [ ] Database RLS policies are enabled
- [ ] Rate limiting is working
- [ ] CORS is properly configured
- [ ] No secrets in code
- [ ] GitHub repository is private
- [ ] Audit logs are enabled

## Post-Deployment

1. Test all features thoroughly
2. Monitor logs for errors
3. Check email deliverability
4. Verify AI generation works
5. Test with multiple users
6. Monitor performance metrics
7. Set up alerts
8. Document any issues

## Maintenance

### Weekly

- Check error logs
- Monitor usage metrics
- Review audit logs

### Monthly

- Review and optimize slow queries
- Check service costs
- Update dependencies
- Review security alerts

### Quarterly

- Database maintenance (VACUUM)
- Review and update documentation
- Performance audit
- Security audit

## Support Resources

- **Vercel**: https://vercel.com/docs
- **Render**: https://render.com/docs
- **Supabase**: https://supabase.com/docs
- **Clerk**: https://clerk.com/docs
- **Resend**: https://resend.com/docs
- **Replicate**: https://replicate.com/docs

## Rollback Procedure

If deployment fails:

1. **Frontend**: Revert to previous deployment in Vercel dashboard
2. **Backend**: Redeploy previous commit in Render
3. **Database**: Restore from backup in Supabase

## Success Criteria

Deployment is successful when:

- [ ] Frontend loads without errors
- [ ] Users can sign in
- [ ] Admin can create tasks
- [ ] Users can view assigned tasks
- [ ] AI generation works
- [ ] Emails are sent
- [ ] All API endpoints respond
- [ ] No errors in logs

Congratulations! Your TaskHub is now live! 🎉
