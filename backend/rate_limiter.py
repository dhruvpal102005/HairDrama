from functools import wraps
from flask import request, jsonify
import os
from datetime import datetime
from collections import defaultdict
import time

# In-memory rate limiting (fallback when Redis is not available)
rate_limit_store = defaultdict(lambda: {'count': 0, 'reset_time': 0})

# Try to connect to Redis, but don't fail if it's not available
try:
    from redis import Redis
    redis_client = Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))
    redis_client.ping()  # Test connection
    REDIS_AVAILABLE = True
except:
    redis_client = None
    REDIS_AVAILABLE = False
    print("⚠️  Redis not available - using in-memory rate limiting (not suitable for production)")

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
            
            if REDIS_AVAILABLE:
                # Use Redis for rate limiting
                try:
                    current = redis_client.get(key)
                    
                    if current is None:
                        redis_client.setex(key, window, 1)
                    elif int(current) >= limit:
                        return jsonify({
                            'error': 'Rate limit exceeded',
                            'limit': limit,
                            'window': window,
                            'retry_after': redis_client.ttl(key)
                        }), 429
                    else:
                        redis_client.incr(key)
                except:
                    # Redis failed, fall through to in-memory
                    pass
            
            # In-memory rate limiting (fallback)
            current_time = time.time()
            if key in rate_limit_store:
                data = rate_limit_store[key]
                if current_time > data['reset_time']:
                    # Window expired, reset
                    rate_limit_store[key] = {'count': 1, 'reset_time': current_time + window}
                elif data['count'] >= limit:
                    # Rate limit exceeded
                    retry_after = int(data['reset_time'] - current_time)
                    return jsonify({
                        'error': 'Rate limit exceeded',
                        'limit': limit,
                        'window': window,
                        'retry_after': retry_after
                    }), 429
                else:
                    # Increment counter
                    rate_limit_store[key]['count'] += 1
            else:
                # First request
                rate_limit_store[key] = {'count': 1, 'reset_time': current_time + window}
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def ai_generation_limit(f):
    """Rate limit for AI generation: 10 per hour"""
    return rate_limit(10, 3600)(f)

def api_call_limit(f):
    """Rate limit for API calls: 100 per minute"""
    return rate_limit(100, 60)(f)
