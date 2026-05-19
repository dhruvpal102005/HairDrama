import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    
    # Flask
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_ENV') == 'development'
    
    # Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    
    # Clerk
    CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY')
    CLERK_WEBHOOK_SECRET = os.getenv('CLERK_WEBHOOK_SECRET')
    
    # Resend
    RESEND_API_KEY = os.getenv('RESEND_API_KEY')
    
    # Replicate
    REPLICATE_API_TOKEN = os.getenv('REPLICATE_API_TOKEN')
    
    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
    
    # Rate Limiting
    RATE_LIMIT_AI_GENERATIONS = 10  # per hour
    RATE_LIMIT_API_CALLS = 100  # per minute
    
    # CORS
    CORS_ORIGINS = [
        'http://localhost:3000',
        'https://*.vercel.app',
        os.getenv('FRONTEND_URL', '')
    ]
    
    # App URL
    APP_URL = os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')

config = Config()
