from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import os
from dotenv import load_dotenv
import jwt
from supabase import create_client, Client
from datetime import datetime
import requests

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')
CORS(app, origins=['http://localhost:3000', 'https://*.vercel.app'])

# Supabase client
supabase: Client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

# Clerk configuration
CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY')

def verify_clerk_token(token: str):
    """Verify Clerk JWT token"""
    try:
        # Decode JWT without verification for now (in production, verify with Clerk's public key)
        import base64
        import json
        
        # Split the JWT
        parts = token.split('.')
        if len(parts) != 3:
            return False
        
        # Decode the payload (second part)
        payload = parts[1]
        # Add padding if needed
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding
        
        decoded = base64.urlsafe_b64decode(payload)
        data = json.loads(decoded)
        
        # Check if token has required fields
        return 'sub' in data or 'user_id' in data
    except Exception as e:
        print(f"Token verification error: {e}")
        return False

def require_auth(f):
    """Authentication decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        user_id = request.headers.get('X-User-Id')
        
        # For development, allow requests with just user_id
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401
        
        # If token is provided, verify it
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            if not verify_clerk_token(token):
                return jsonify({'error': 'Invalid token'}), 401
        
        request.user_id = user_id
        
        # Auto-create user if doesn't exist
        try:
            result = supabase.table('users').select('id').eq('clerk_id', user_id).execute()
            if not result.data:
                # Create user with basic info
                supabase.table('users').insert({
                    'clerk_id': user_id,
                    'email': f'{user_id}@user.clerk',
                    'name': 'User',
                    'role': 'user'
                }).execute()
                print(f"Auto-created user: {user_id}")
        except Exception as e:
            print(f"User auto-creation error: {e}")
        
        return f(*args, **kwargs)
    return decorated_function

def require_admin(f):
    """Admin role decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = request.user_id
        
        # Check if user is admin
        result = supabase.table('users').select('role').eq('clerk_id', user_id).execute()
        if not result.data or result.data[0]['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

# Auth endpoints
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/auth/me', methods=['GET'])
@require_auth
def get_current_user():
    """Get current user profile"""
    try:
        result = supabase.table('users').select('*').eq('clerk_id', request.user_id).execute()
        if not result.data:
            # Auto-create user if doesn't exist
            user_data = {
                'clerk_id': request.user_id,
                'email': f'{request.user_id}@clerk.user',
                'name': 'User',
                'role': 'user'
            }
            result = supabase.table('users').insert(user_data).execute()
        return jsonify(result.data[0])
    except Exception as e:
        print(f"Error getting user: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/sync', methods=['POST'])
def sync_user():
    """Sync user from Clerk - can be called with user info"""
    data = request.json
    
    # Get user_id from header or data
    user_id = request.headers.get('X-User-Id') or data.get('clerk_id')
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    user_data = {
        'clerk_id': user_id,
        'email': data.get('email', f'{user_id}@user.clerk'),
        'name': data.get('name', 'User'),
        'role': data.get('role', 'user'),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    # Upsert user (insert or update)
    try:
        # Check if user exists
        result = supabase.table('users').select('*').eq('clerk_id', user_id).execute()
        
        if result.data:
            # Update existing user
            result = supabase.table('users').update(user_data).eq('clerk_id', user_id).execute()
        else:
            # Insert new user
            result = supabase.table('users').insert(user_data).execute()
        
        return jsonify(result.data[0]), 200
    except Exception as e:
        print(f"Sync error: {e}")
        return jsonify({'error': str(e)}), 500

# Admin Task endpoints
@app.route('/api/users', methods=['GET'])
@require_auth
@require_admin
def list_users():
    """List all users (admin only)"""
    result = supabase.table('users').select('*').execute()
    return jsonify(result.data)

@app.route('/api/tasks', methods=['POST'])
@require_auth
@require_admin
def create_task():
    """Create a new task"""
    data = request.json
    
    task_data = {
        'title': data['title'],
        'description': data.get('description', ''),
        'product_image_url': data['product_image_url'],
        'created_by': request.user_id,
        'status': 'pending',
        'created_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('tasks').insert(task_data).execute()
    
    # Audit log
    supabase.table('audit_logs').insert({
        'user_id': request.user_id,
        'action': 'task_created',
        'entity_type': 'task',
        'entity_id': result.data[0]['id'],
        'timestamp': datetime.utcnow().isoformat()
    }).execute()
    
    return jsonify(result.data[0]), 201

@app.route('/api/tasks', methods=['GET'])
@require_auth
@require_admin
def list_all_tasks():
    """List all tasks (admin only)"""
    result = supabase.table('tasks').select('*, assigned_user:users!assigned_to(*)').execute()
    return jsonify(result.data)

@app.route('/api/tasks/<int:task_id>/assign', methods=['POST'])
@require_auth
@require_admin
def assign_task(task_id):
    """Assign task to a user"""
    data = request.json
    user_id = data['user_id']
    
    # Update task
    result = supabase.table('tasks').update({
        'assigned_to': user_id,
        'status': 'assigned',
        'updated_at': datetime.utcnow().isoformat()
    }).eq('id', task_id).execute()
    
    # Get user email
    user = supabase.table('users').select('email, name').eq('id', user_id).execute()
    task = result.data[0]
    
    # Send email notification (will implement with Resend)
    from email_service import send_task_assigned_email
    send_task_assigned_email(user.data[0]['email'], user.data[0]['name'], task)
    
    # Audit log
    supabase.table('audit_logs').insert({
        'user_id': request.user_id,
        'action': 'task_assigned',
        'entity_type': 'task',
        'entity_id': task_id,
        'timestamp': datetime.utcnow().isoformat()
    }).execute()
    
    return jsonify(result.data[0])

@app.route('/api/tasks/<int:task_id>/accept', methods=['PUT'])
@require_auth
@require_admin
def accept_task(task_id):
    """Accept completed task"""
    result = supabase.table('tasks').update({
        'status': 'accepted',
        'updated_at': datetime.utcnow().isoformat()
    }).eq('id', task_id).execute()
    
    # Get assigned user email
    task = result.data[0]
    user = supabase.table('users').select('email, name').eq('id', task['assigned_to']).execute()
    
    # Send email notification
    from email_service import send_task_accepted_email
    send_task_accepted_email(user.data[0]['email'], user.data[0]['name'], task)
    
    return jsonify(result.data[0])

@app.route('/api/tasks/<int:task_id>/request-revision', methods=['PUT'])
@require_auth
@require_admin
def request_revision(task_id):
    """Request revision on task"""
    data = request.json
    
    result = supabase.table('tasks').update({
        'status': 'revision_requested',
        'revision_notes': data.get('notes', ''),
        'updated_at': datetime.utcnow().isoformat()
    }).eq('id', task_id).execute()
    
    return jsonify(result.data[0])

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@require_auth
@require_admin
def delete_task(task_id):
    """Delete a task"""
    supabase.table('tasks').delete().eq('id', task_id).execute()
    return jsonify({'message': 'Task deleted'}), 200

# User Task endpoints
@app.route('/api/my-tasks', methods=['GET'])
@require_auth
def get_my_tasks():
    """Get tasks assigned to current user"""
    # Get user's internal ID
    user = supabase.table('users').select('id').eq('clerk_id', request.user_id).execute()
    if not user.data:
        return jsonify([])
    
    result = supabase.table('tasks').select('*').eq('assigned_to', user.data[0]['id']).execute()
    return jsonify(result.data)

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
@require_auth
def get_task(task_id):
    """Get single task details"""
    result = supabase.table('tasks').select('*').eq('id', task_id).execute()
    if not result.data:
        return jsonify({'error': 'Task not found'}), 404
    return jsonify(result.data[0])

@app.route('/api/tasks/<int:task_id>/start', methods=['PUT'])
@require_auth
def start_task(task_id):
    """Mark task as in progress"""
    result = supabase.table('tasks').update({
        'status': 'in_progress',
        'started_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }).eq('id', task_id).execute()
    
    return jsonify(result.data[0])

@app.route('/api/tasks/<int:task_id>/submit', methods=['POST'])
@require_auth
def submit_task(task_id):
    """Submit completed task"""
    # Check if 8 images are generated
    images = supabase.table('generated_images').select('*').eq('task_id', task_id).execute()
    
    if len(images.data) < 8:
        return jsonify({'error': 'All 8 images must be generated before submission'}), 400
    
    result = supabase.table('tasks').update({
        'status': 'submitted',
        'submitted_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }).eq('id', task_id).execute()
    
    # Get admin email
    task = result.data[0]
    admin = supabase.table('users').select('email, name').eq('clerk_id', task['created_by']).execute()
    
    # Send email notification
    from email_service import send_task_submitted_email
    send_task_submitted_email(admin.data[0]['email'], admin.data[0]['name'], task)
    
    return jsonify(result.data[0])

# AI Generation endpoints
@app.route('/api/tasks/<int:task_id>/generate', methods=['POST'])
@require_auth
def generate_image(task_id):
    """Start AI image generation"""
    from ai_service import start_generation
    from rate_limiter import ai_generation_limit
    
    # Apply rate limiting
    @ai_generation_limit
    def _generate():
        data = request.json
        image_type = data['image_type']  # white_bg, theme, creative, model
        angle = data.get('angle')  # For model images: front, side, closeup
        theme = data.get('theme')  # For theme images
        
        # Get task
        task = supabase.table('tasks').select('*').eq('id', task_id).execute()
        if not task.data:
            return jsonify({'error': 'Task not found'}), 404
        
        # Start background job
        job_id = start_generation(task_id, task.data[0]['product_image_url'], image_type, angle, theme)
        
        return jsonify({'job_id': job_id, 'status': 'processing'})
    
    return _generate()

@app.route('/api/jobs/<job_id>/status', methods=['GET'])
@require_auth
def get_job_status(job_id):
    """Poll generation job status"""
    from ai_service import get_generation_status
    
    status = get_generation_status(job_id)
    return jsonify(status)

@app.route('/api/tasks/<int:task_id>/generations', methods=['GET'])
@require_auth
def get_generations(task_id):
    """Get all generated images for a task"""
    result = supabase.table('generated_images').select('*').eq('task_id', task_id).execute()
    return jsonify(result.data)

@app.route('/api/generations/<int:gen_id>', methods=['DELETE'])
@require_auth
def delete_generation(gen_id):
    """Delete a generated image"""
    supabase.table('generated_images').delete().eq('id', gen_id).execute()
    return jsonify({'message': 'Image deleted'}), 200

# Analytics endpoints
@app.route('/api/analytics', methods=['GET'])
@require_auth
@require_admin
def get_analytics():
    """Get platform analytics"""
    total_users = supabase.table('users').select('id', count='exact').execute()
    total_tasks = supabase.table('tasks').select('id', count='exact').execute()
    completed_tasks = supabase.table('tasks').select('id', count='exact').eq('status', 'accepted').execute()
    
    return jsonify({
        'total_users': total_users.count,
        'total_tasks': total_tasks.count,
        'completed_tasks': completed_tasks.count,
        'pending_tasks': total_tasks.count - completed_tasks.count
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
