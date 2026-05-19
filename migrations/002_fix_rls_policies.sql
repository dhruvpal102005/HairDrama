-- Fix RLS policies to avoid infinite recursion
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can create tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view images for their tasks" ON generated_images;
DROP POLICY IF EXISTS "Admins can view all images" ON generated_images;
DROP POLICY IF EXISTS "Users can insert images for their tasks" ON generated_images;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;

-- Disable RLS for development (simpler approach)
-- In production, you would use service role key to bypass RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, use these simpler policies instead:
-- (Uncomment the following lines and comment out the DISABLE commands above)

/*
-- Simple policy: Allow all authenticated users to read users table
CREATE POLICY "Allow authenticated users to read users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to update their own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Simple policy: Allow all authenticated users to read tasks
CREATE POLICY "Allow authenticated users to read tasks"
    ON tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert tasks"
    ON tasks FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update tasks"
    ON tasks FOR UPDATE
    TO authenticated
    USING (true);

-- Simple policy: Allow all authenticated users to manage generated_images
CREATE POLICY "Allow authenticated users to read images"
    ON generated_images FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert images"
    ON generated_images FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete images"
    ON generated_images FOR DELETE
    TO authenticated
    USING (true);

-- Simple policy: Allow all authenticated users to read audit logs
CREATE POLICY "Allow authenticated users to read audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (true);
*/
