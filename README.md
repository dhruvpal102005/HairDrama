# TaskHub - AI Product Photography Studio

A full-stack task management platform with integrated AI-powered product photography generation. Admins assign product photography tasks to users, who generate 8 professional product images using AI while maintaining exact product consistency.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Flask (Python), RESTful API
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Clerk (OAuth 2.0 - Google & GitHub)
- **Email**: Resend (HTML email templates)
- **AI Generation**: Replicate (SDXL with ControlNet)
- **Background Jobs**: Python-RQ with Redis
- **Deployment**: Vercel (Frontend), Render (Backend), Supabase (Database)

### System Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Next.js   │─────▶│  Flask API   │─────▶│  Supabase   │
│  (Frontend) │      │  (Backend)   │      │  (Database) │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │                      
       │                     ▼                      
       │              ┌──────────────┐              
       │              │  Redis + RQ  │              
       │              │ (Background) │              
       │              └──────────────┘              
       │                     │                      
       ▼                     ▼                      
┌─────────────┐      ┌──────────────┐              
│    Clerk    │      │  Replicate   │              
│   (Auth)    │      │  (AI Gen)    │              
└─────────────┘      └──────────────┘              
```

## 🚀 Local Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Redis (for background jobs)
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd Assignment
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Add your environment variables:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with:
# - SUPABASE_URL
# - SUPABASE_KEY
# - CLERK_SECRET_KEY
# - RESEND_API_KEY
# - REPLICATE_API_TOKEN
# - REDIS_URL=redis://localhost:6379
```

### 4. Database Setup

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor in your Supabase dashboard
3. Run the migration file: `migrations/001_initial_schema.sql`
4. Verify tables are created with RLS policies enabled

### 5. Service Configuration

#### Clerk Setup
1. Create account at https://clerk.com
2. Create new application
3. Enable Google and GitHub OAuth providers
4. Copy publishable and secret keys to `.env` files
5. Add webhook endpoint: `https://your-backend-url/api/auth/sync`

#### Resend Setup
1. Create account at https://resend.com (free tier: 3,000 emails/month)
2. Get API key from dashboard
3. Add to backend `.env` file

#### Replicate Setup
1. Create account at https://replicate.com
2. Get API token from account settings
3. Add to backend `.env` file

### 6. Run the Application

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Backend
cd backend
python app.py

# Terminal 3: Start Background Worker
cd backend
python worker.py

# Terminal 4: Start Frontend
npm run dev
```

Visit http://localhost:3000

## 📊 Database Migrations

All migrations are in the `/migrations` folder. Run them in order:

1. `001_initial_schema.sql` - Creates tables, indexes, RLS policies

### Schema Overview

**users**
- Stores user profiles from Clerk OAuth
- Fields: id, clerk_id, email, name, role (admin/user)

**tasks**
- Product photography tasks
- Status flow: pending → assigned → in_progress → submitted → accepted/revision_requested

**generated_images**
- AI-generated product images (8 per task)
- Types: white_bg, theme, creative, model

**audit_logs**
- Tracks all database mutations

## 🤖 AI Approach for Product Consistency

### Challenge
Generate 8 different product images where the product looks EXACTLY the same, only backgrounds/settings change.

### Solution

1. **Background Removal**
   - Use `rembg` library to cleanly extract product from original image
   - Creates transparent PNG with just the product

2. **Prompt Engineering**
   - Base prompt: "professional product photography, DSLR quality, 8k resolution"
   - Negative prompts: "cartoon, anime, illustration, distorted, deformed"
   - Type-specific prompts for each image category

3. **AI Model**
   - Using Stability AI SDXL via Replicate
   - ControlNet for maintaining product consistency
   - Pass extracted product as reference image
   - 50 inference steps for high quality

4. **Generation Process**
   ```python
   1. Remove background from product image
   2. Generate type-specific prompt
   3. Submit to Replicate API with product reference
   4. Process in background job (1-2 min per image)
   5. Poll status and save to database
   6. User can regenerate until satisfied
   ```

5. **Quality Assurance**
   - User reviews each generated image
   - Can regenerate any image multiple times
   - Must generate all 8 before submission
   - Admin reviews final submission

### Image Types Generated

1. **White Background** (1 image)
   - Pure white (#FFFFFF), e-commerce style

2. **Theme Backgrounds** (2 images)
   - Marble surface
   - Velvet fabric

3. **Creative/Lifestyle** (2 images)
   - Beach sunset scene
   - Modern minimalist interior

4. **Model Wearing** (3 images)
   - Front view
   - 45-degree side angle
   - Close-up detail shot

## 📧 Email Notifications

Three email triggers with professional HTML templates:

1. **Task Assigned** → User receives notification
2. **Task Submitted** → Admin receives notification
3. **Task Accepted** → User receives confirmation

All emails include:
- Responsive HTML design
- Direct links to tasks
- Task details and status
- Professional branding

## 🔒 Security Features

- **Row Level Security (RLS)**: Users only see their assigned tasks
- **JWT Authentication**: Clerk tokens verified on every request
- **Rate Limiting**: 10 AI generations/hour, 100 API calls/min
- **Audit Logging**: All database mutations tracked
- **Protected Routes**: Unauthenticated users redirected to landing page

## 🎨 Features

### Admin Features
- Create tasks with product images
- Assign tasks to specific users
- View all users and tasks
- Platform analytics dashboard
- Review submitted images
- Accept or request revisions
- Email notifications on task submission

### User Features
- View assigned tasks
- AI Studio for image generation
- Generate 8 required image variations
- Regenerate images until satisfied
- Progress tracking (X/8 completed)
- Submit completed tasks
- Email notifications on assignment/acceptance

### AI Studio Features
- Real-time generation status
- Individual image regeneration
- Download generated images
- Delete and retry
- Progress tracker
- Quality guidelines

## 🌐 Deployment

### Frontend (Vercel)
```bash
vercel --prod
```

### Backend (Render)
1. Create new Web Service
2. Connect GitHub repository
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Add environment variables

### Database (Supabase)
- Already hosted, just configure connection strings

## 📝 Known Limitations

1. **AI Generation Time**: Each image takes 1-2 minutes to generate
2. **Product Consistency**: While using ControlNet, 100% consistency depends on AI model capabilities
3. **Rate Limits**: Free tier limits on Replicate API
4. **Background Jobs**: Requires Redis server running
5. **Email Sending**: Limited to 3,000 emails/month on Resend free tier

## 🧪 Testing

### Test with Pearl Jewelry Image
See `/generated_samples` folder for example outputs using the provided pearl jewelry test image.

## 📦 Project Structure

```
Assignment/
├── app/                    # Next.js pages
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Dashboard pages
│   └── tasks/[id]/        # Task detail pages
├── components/            # React components
│   ├── AIStudio.tsx      # AI generation interface
│   ├── AdminDashboard.tsx
│   ├── UserDashboard.tsx
│   └── ...
├── backend/              # Flask API
│   ├── app.py           # Main API
│   ├── ai_service.py    # AI generation logic
│   ├── email_service.py # Email templates
│   └── worker.py        # Background jobs
├── migrations/          # Database migrations
└── generated_samples/   # Test image outputs
```

## 🤝 Contributing

This is an assignment project. No contributions accepted.

## 📄 License

Proprietary - Assignment Project
