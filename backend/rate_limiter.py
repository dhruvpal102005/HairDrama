from functools import wraps
from flask import request, jsonify
from redis import Redis
import os
from datetime import datetime

redis_client = Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))

def rate_limit(limit: int, window: int):
    """
    Rate limiting decorator
    
    Args:
        limit: Maximum number of requests
        window: Time window in seconds
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get user identifier
            user_id = request.headers.get('X-User-Id', request.remote_addr)
            key = f"rate_limit:{f.__name__}:{user_id}"
            
            # Get current count
            current = redis_client.get(key)
            
            if current is None:
                # First request in window
                redis_client.setex(key, window, 1)
            elif int(current) >= limit:
                # Rate limit exceeded
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'limit': limit,
                    'window': window,
                    'retry_after': redis_client.ttl(key)
                }), 429
            else:
                # Increment counter
                redis_client.incr(key)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def ai_generation_limit(f):
    """Rate limit for AI generation: 10 per hour"""
    return rate_limit(10, 3600)(f)

def api_call_limit(f):
    """Rate limit for API calls: 100 per minute"""
    return rate_limit(100, 60)(f)
