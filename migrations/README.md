# Database Migrations

## Running Migrations

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migrations in order:
   - `001_initial_schema.sql` - Creates all tables, indexes, and RLS policies

## Schema Overview

### Tables

**users**
- Stores user profiles from Clerk OAuth
- Fields: id, clerk_id, email, name, role (admin/user)
- RLS: Users see own profile, admins see all

**tasks**
- Product photography tasks
- Fields: title, description, product_image_url, status, assigned_to, etc.
- Status flow: pending → assigned → in_progress → submitted → accepted/revision_requested
- RLS: Users see assigned tasks, admins see all

**generated_images**
- AI-generated product images (8 per task)
- Fields: task_id, image_type, angle, theme, image_url, prompt_used
- Image types: white_bg, theme, creative, model
- RLS: Users see images for their tasks, admins see all

**audit_logs**
- Track all database mutations
- Fields: user_id, action, entity_type, entity_id, timestamp
- RLS: Admins only

### Row Level Security (RLS)

All tables have RLS enabled with policies enforcing:
- Users can only access their assigned tasks and related data
- Admins have full access to all data
- No direct database edits allowed without proper authentication
