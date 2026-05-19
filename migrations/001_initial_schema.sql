-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    product_image_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'submitted', 'accepted', 'revision_requested')),
    created_by VARCHAR(255) NOT NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    revision_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    submitted_at TIMESTAMP
);

-- Create generated_images table
CREATE TABLE IF NOT EXISTS generated_images (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    image_type VARCHAR(50) NOT NULL CHECK (image_type IN ('white_bg', 'theme', 'creative', 'model')),
    angle VARCHAR(50) CHECK (angle IN ('front', 'side', 'closeup')),
    theme VARCHAR(100),
    image_url TEXT NOT NULL,
    prompt_used TEXT,
    metadata JSONB,
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_generated_images_task_id ON generated_images(task_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (clerk_id = current_setting('app.current_user_id', true));

CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = current_setting('app.current_user_id', true)
            AND role = 'admin'
        )
    );

-- RLS Policies for tasks table
CREATE POLICY "Users can view their assigned tasks"
    ON tasks FOR SELECT
    USING (
        assigned_to IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('app.current_user_id', true)
        )
    );

CREATE POLICY "Admins can view all tasks"
    ON tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = current_setting('app.current_user_id', true)
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can create tasks"
    ON tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = current_setting('app.current_user_id', true)
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update tasks"
    ON tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = current_setting('app.current_user_id', true)
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can update their assigned tasks"
    ON tasks FOR UPDATE
    USING (
        assigned_to IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('app.current_user_id', true)
        )
    );

-- RLS Policies for generated_images table
CREATE POLICY "Users can view images for their tasks"
    ON generated_images FOR SELECT
    USING (
        task_id IN (
            SELECT id FROM tasks
            WHERE assigned_to IN (
                SELECT id FROM users
                WHERE clerk_id = current_setting('app.current_user_id', true)
            )
        )
    );

CREATE POLICY "Admins can view all images"
    ON generated_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = current_setting('app.current_user_id', true)
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can insert images for their tasks"
    ON generated_images FOR INSERT
    WITH CHECK (
        task_id IN (
            SELECT id FROM tasks
            WHERE assigned_to IN (
                SELECT id FROM users
                WHERE clerk_id = current_setting('app.current_user_id', true)
            )
        )
    );

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = current_setting('app.current_user_id', true)
            AND role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
