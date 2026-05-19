# TaskHub Architecture Documentation

## System Overview

TaskHub is a full-stack application that combines task management with AI-powered product photography generation. The system ensures product consistency across multiple generated images using advanced AI techniques.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js 14 (React + TypeScript)                     │   │
│  │  - Server-Side Rendering (SSR)                       │   │
│  │  - App Router                                        │   │
│  │  - Tailwind CSS                                      │   │
│  │  - Clerk Auth Components                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Flask REST API                                      │   │
│  │  - JWT Authentication                                │   │
│  │  - Rate Limiting                                     │   │
│  │  - Request Validation                                │   │
│  │  - CORS Handling                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│  AUTHENTICATION  │ │   DATABASE   │ │  BACKGROUND JOBS │
│                  │ │              │ │                  │
│  Clerk OAuth     │ │  Supabase    │ │  Redis + RQ      │
│  - Google        │ │  PostgreSQL  │ │  - AI Generation │
│  - GitHub        │ │  - RLS       │ │  - Email Queue   │
│  - JWT Tokens    │ │  - Triggers  │ │  - Job Polling   │
└──────────────────┘ └──────────────┘ └──────────────────┘
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
                ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                │  AI SERVICE  │     │    EMAIL     │     │   STORAGE    │
                │              │     │              │     │              │
                │  Replicate   │     │   Resend     │     │  Supabase    │
                │  - SDXL      │     │  - HTML      │     │  Storage     │
                │  - ControlNet│     │  - Templates │     │  - Images    │
                └──────────────┘     └──────────────┘     └──────────────┘
```

## Component Breakdown

### 1. Frontend (Next.js)

**Technology**: Next.js 14, TypeScript, Tailwind CSS

**Key Components**:
- `app/page.tsx` - Landing page with hero section
- `app/dashboard/page.tsx` - Role-based dashboard router
- `components/AdminDashboard.tsx` - Admin interface
- `components/UserDashboard.tsx` - User interface
- `components/AIStudio.tsx` - AI generation interface
- `components/TaskCard.tsx` - Task display component

**Features**:
- Server-Side Rendering for SEO
- Client-side state management
- Real-time UI updates
- Dark/Light theme toggle
- Responsive design (mobile-first)
- Toast notifications
- Loading states and error boundaries

**Authentication Flow**:
```
User clicks Sign In
    ↓
Clerk Modal Opens
    ↓
User selects OAuth Provider (Google/GitHub)
    ↓
OAuth Flow Completes
    ↓
Clerk creates session
    ↓
Frontend receives JWT token
    ↓
Token sent with every API request
```

### 2. Backend API (Flask)

**Technology**: Flask, Python 3.11

**Structure**:
```
backend/
├── app.py              # Main API routes
├── ai_service.py       # AI generation logic
├── email_service.py    # Email templates
├── rate_limiter.py     # Rate limiting
├── config.py           # Configuration
└── worker.py           # Background job worker
```

**API Endpoints**:

**Authentication**:
- `GET /api/auth/me` - Get current user
- `POST /api/auth/sync` - Sync user from Clerk webhook

**Admin Tasks**:
- `POST /api/tasks` - Create task
- `GET /api/tasks` - List all tasks
- `POST /api/tasks/:id/assign` - Assign task
- `PUT /api/tasks/:id/accept` - Accept task
- `PUT /api/tasks/:id/request-revision` - Request revision
- `DELETE /api/tasks/:id` - Delete task

**User Tasks**:
- `GET /api/my-tasks` - Get my tasks
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id/start` - Start task
- `POST /api/tasks/:id/submit` - Submit task

**AI Generation**:
- `POST /api/tasks/:id/generate` - Start generation
- `GET /api/jobs/:job_id/status` - Poll job status
- `GET /api/tasks/:id/generations` - Get generated images
- `DELETE /api/generations/:id` - Delete image

**Analytics**:
- `GET /api/analytics` - Platform analytics

### 3. Database (Supabase PostgreSQL)

**Schema**:

```sql
users
├── id (SERIAL PRIMARY KEY)
├── clerk_id (VARCHAR UNIQUE)
├── email (VARCHAR UNIQUE)
├── name (VARCHAR)
├── role (VARCHAR) -- 'admin' or 'user'
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

tasks
├── id (SERIAL PRIMARY KEY)
├── title (VARCHAR)
├── description (TEXT)
├── product_image_url (TEXT)
├── status (VARCHAR) -- pending, assigned, in_progress, submitted, accepted, revision_requested
├── created_by (VARCHAR) -- clerk_id
├── assigned_to (INTEGER FK → users.id)
├── revision_notes (TEXT)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── started_at (TIMESTAMP)
└── submitted_at (TIMESTAMP)

generated_images
├── id (SERIAL PRIMARY KEY)
├── task_id (INTEGER FK → tasks.id)
├── image_type (VARCHAR) -- white_bg, theme, creative, model
├── angle (VARCHAR) -- front, side, closeup
├── theme (VARCHAR) -- marble, velvet, etc.
├── image_url (TEXT)
├── prompt_used (TEXT)
├── metadata (JSONB)
├── is_final (BOOLEAN)
└── created_at (TIMESTAMP)

audit_logs
├── id (SERIAL PRIMARY KEY)
├── user_id (VARCHAR)
├── action (VARCHAR)
├── entity_type (VARCHAR)
├── entity_id (INTEGER)
├── details (JSONB)
└── timestamp (TIMESTAMP)
```

**Row Level Security (RLS)**:
- Users can only see their assigned tasks
- Admins can see all data
- Audit logs are admin-only
- Generated images follow task visibility

### 4. AI Generation Pipeline

**Technology**: Replicate (SDXL), rembg, Python-RQ

**Process Flow**:

```
1. User clicks "Generate" in AI Studio
        ↓
2. Frontend sends POST /api/tasks/:id/generate
        ↓
3. Backend validates request and rate limit
        ↓
4. Background job queued in Redis
        ↓
5. Worker picks up job
        ↓
6. Download product image
        ↓
7. Remove background using rembg
        ↓
8. Generate type-specific prompt
        ↓
9. Call Replicate API with:
   - Prompt
   - Negative prompt
   - Product reference image
   - ControlNet settings
        ↓
10. Wait for generation (1-2 minutes)
        ↓
11. Save result to database
        ↓
12. Frontend polls job status
        ↓
13. Display generated image
```

**Product Consistency Strategy**:

1. **Background Removal**:
   - Use `rembg` to extract product cleanly
   - Creates transparent PNG with only product
   - Removes all background context

2. **Prompt Engineering**:
   ```python
   base_prompt = "professional product photography, DSLR quality, 8k resolution"
   negative_prompt = "cartoon, anime, illustration, distorted, deformed"
   
   # Type-specific additions
   if white_bg:
       prompt += ", pure white background, e-commerce style"
   elif theme:
       prompt += f", {theme} background, elegant setting"
   elif creative:
       prompt += ", lifestyle scene, photorealistic"
   elif model:
       prompt += f", model wearing product, {angle} view"
   ```

3. **ControlNet Integration**:
   - Pass extracted product as reference
   - Ensures product structure maintained
   - Only background/setting changes

4. **Quality Control**:
   - User can regenerate any image
   - Multiple attempts until satisfied
   - All 8 required before submission

### 5. Email Service

**Technology**: Resend

**Email Templates**:

1. **Task Assigned**:
   - Sent to: User
   - Trigger: Admin assigns task
   - Content: Task details, link to task

2. **Task Submitted**:
   - Sent to: Admin
   - Trigger: User submits task
   - Content: Task summary, link to review

3. **Task Accepted**:
   - Sent to: User
   - Trigger: Admin accepts task
   - Content: Confirmation, feedback

**Template Features**:
- Responsive HTML design
- Inline CSS for email clients
- Direct action links
- Professional branding
- Dark mode compatible

### 6. Background Jobs

**Technology**: Redis + Python-RQ

**Job Types**:

1. **AI Generation Jobs**:
   - Duration: 1-2 minutes
   - Timeout: 10 minutes
   - Retry: Manual (user clicks regenerate)

2. **Email Jobs** (future):
   - Duration: < 1 second
   - Retry: 3 attempts

**Worker Configuration**:
```python
# worker.py
with Connection(redis_conn):
    worker = Worker(['default'])
    worker.work()
```

### 7. Security

**Authentication**:
- Clerk handles OAuth flow
- JWT tokens for API requests
- Token verification on every request
- Session management

**Authorization**:
- Role-based access control (RBAC)
- Admin vs User permissions
- Row Level Security in database
- Protected API endpoints

**Rate Limiting**:
- AI Generation: 10 per hour per user
- API Calls: 100 per minute per user
- Implemented with Redis counters

**Data Protection**:
- HTTPS only in production
- Environment variables for secrets
- No sensitive data in logs
- Audit trail for all actions

## Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│  - Next.js SSR                                          │
│  - Edge Network CDN                                     │
│  - Automatic HTTPS                                      │
└─────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Render (Backend)                       │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Web Service    │  │  Worker Service │              │
│  │  (Flask API)    │  │  (RQ Worker)    │              │
│  └─────────────────┘  └─────────────────┘              │
│           │                     │                        │
│           └──────────┬──────────┘                        │
│                      │                                   │
│           ┌──────────▼──────────┐                        │
│           │   Redis Instance    │                        │
│           └─────────────────────┘                        │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   Supabase   │ │  Replicate   │ │    Resend    │
    │  (Database)  │ │  (AI Gen)    │ │   (Email)    │
    └──────────────┘ └──────────────┘ └──────────────┘
```

## Performance Considerations

**Frontend**:
- SSR for initial page load
- Code splitting by route
- Image optimization with Next.js Image
- Lazy loading for heavy components

**Backend**:
- Background jobs for long operations
- Database connection pooling
- Redis caching for rate limits
- Efficient SQL queries with indexes

**Database**:
- Indexed foreign keys
- RLS policies optimized
- Connection pooling
- Regular vacuum and analyze

**AI Generation**:
- Async processing
- Job queue management
- Timeout handling
- Error recovery

## Scalability

**Horizontal Scaling**:
- Frontend: Vercel auto-scales
- Backend: Add more Render instances
- Workers: Add more worker processes
- Database: Supabase handles scaling

**Vertical Scaling**:
- Increase worker memory for larger images
- Upgrade database tier for more connections
- Redis memory for more jobs

## Monitoring

**Logs**:
- Frontend: Vercel logs
- Backend: Render logs
- Database: Supabase logs
- Jobs: RQ dashboard

**Metrics**:
- API response times
- Job completion rates
- Error rates
- User activity

## Future Enhancements

1. **Real-time Updates**: WebSockets for live generation status
2. **Batch Processing**: Generate all 8 images at once
3. **Image Editing**: In-app image adjustments
4. **Version Control**: Track image iterations
5. **Analytics Dashboard**: Detailed metrics
6. **Mobile App**: React Native version
7. **API Rate Limiting UI**: User-facing limits display
8. **Advanced AI Models**: Fine-tuned models for specific products
