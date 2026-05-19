import os
import replicate
from rembg import remove
from PIL import Image
import io
import base64
from redis import Redis
from rq import Queue
import uuid
from supabase import create_client

redis_conn = Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))
queue = Queue(connection=redis_conn)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

def remove_background(image_url: str) -> str:
    """Remove background from product image"""
    import requests
    
    # Download image
    response = requests.get(image_url)
    input_image = Image.open(io.BytesIO(response.content))
    
    # Remove background
    output_image = remove(input_image)
    
    # Convert to base64
    buffered = io.BytesIO()
    output_image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

def generate_prompt(image_type: str, angle: str = None, theme: str = None) -> tuple:
    """Generate prompts for different image types"""
    
    base_prompt = "professional product photography, DSLR quality, 8k resolution, sharp focus, studio lighting"
    negative_prompt = "cartoon, anime, illustration, drawing, painting, sketch, low quality, blurry, distorted, deformed, ugly, bad anatomy"
    
    if image_type == 'white_bg':
        prompt = f"{base_prompt}, pure white background (#FFFFFF), clean product shot, e-commerce style, centered composition"
        
    elif image_type == 'theme':
        themes = {
            'marble': 'luxury marble surface, elegant setting, soft shadows',
            'velvet': 'rich velvet fabric background, premium feel, dramatic lighting',
            'wood': 'natural wood texture, rustic aesthetic, warm tones',
            'silk': 'smooth silk fabric, flowing texture, soft lighting'
        }
        theme_desc = themes.get(theme, 'elegant themed background')
        prompt = f"{base_prompt}, {theme_desc}, product naturally positioned"
        
    elif image_type == 'creative':
        creative_scenes = [
            'beach sunset scene, golden hour lighting, sand texture, ocean in background',
            'modern minimalist interior, concrete walls, natural daylight, contemporary aesthetic',
            'botanical garden setting, lush greenery, natural light, organic composition',
            'urban rooftop scene, city skyline background, evening ambiance'
        ]
        import random
        scene = random.choice(creative_scenes)
        prompt = f"{base_prompt}, {scene}, lifestyle photography, photorealistic"
        
    elif image_type == 'model':
        angles_desc = {
            'front': 'front view, model facing camera, eye level shot',
            'side': '45-degree side angle, profile view, dynamic composition',
            'closeup': 'extreme close-up, detailed shot, shallow depth of field'
        }
        angle_desc = angles_desc.get(angle, 'front view')
        prompt = f"{base_prompt}, professional model wearing product, {angle_desc}, natural skin tones, realistic human features, fashion photography"
        negative_prompt += ", mannequin, plastic, artificial, fake skin"
    
    return prompt, negative_prompt

def process_generation_sync(task_id: int, product_image_url: str, image_type: str, angle: str, theme: str):
    """Synchronous image generation (Windows compatible)"""
    try:
        print(f"Starting generation for task {task_id}, type: {image_type}")
        
        # Step 1: Remove background from product
        print("Step 1: Removing background...")
        product_no_bg = remove_background(product_image_url)
        
        # Step 2: Generate prompt
        print("Step 2: Generating prompt...")
        prompt, negative_prompt = generate_prompt(image_type, angle, theme)
        print(f"Prompt: {prompt[:100]}...")
        
        # Step 3: Call Replicate API for image generation
        print("Step 3: Calling Replicate API...")
        output = replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input={
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "image": product_no_bg,  # Use product as reference
                "num_outputs": 1,
                "guidance_scale": 7.5,
                "num_inference_steps": 50,
                "width": 1024,
                "height": 1024
            }
        )
        
        generated_url = output[0] if isinstance(output, list) else output
        print(f"Generated image URL: {generated_url}")
        
        # Step 4: Save to database
        print("Step 4: Saving to database...")
        result = supabase.table('generated_images').insert({
            'task_id': task_id,
            'image_type': image_type,
            'angle': angle,
            'theme': theme,
            'image_url': generated_url,
            'prompt_used': prompt,
            'metadata': {
                'negative_prompt': negative_prompt,
                'model': 'sdxl',
                'steps': 50
            }
        }).execute()
        
        print(f"Generation completed! Image ID: {result.data[0]['id']}")
        
        return {
            'status': 'completed',
            'image_url': generated_url,
            'image_id': result.data[0]['id']
        }
        
    except Exception as e:
        print(f"Generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'status': 'failed',
            'error': str(e)
        }

def process_generation(task_id: int, product_image_url: str, image_type: str, angle: str, theme: str):
    """Background job to generate image"""
    try:
        # Step 1: Remove background from product
        product_no_bg = remove_background(product_image_url)
        
        # Step 2: Generate prompt
        prompt, negative_prompt = generate_prompt(image_type, angle, theme)
        
        # Step 3: Call Replicate API for image generation
        # Using SDXL with ControlNet for product consistency
        output = replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input={
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "image": product_no_bg,  # Use product as reference
                "num_outputs": 1,
                "guidance_scale": 7.5,
                "num_inference_steps": 50,
                "width": 1024,
                "height": 1024
            }
        )
        
        generated_url = output[0] if isinstance(output, list) else output
        
        # Step 4: Save to database
        result = supabase.table('generated_images').insert({
            'task_id': task_id,
            'image_type': image_type,
            'angle': angle,
            'theme': theme,
            'image_url': generated_url,
            'prompt_used': prompt,
            'metadata': {
                'negative_prompt': negative_prompt,
                'model': 'sdxl',
                'steps': 50
            }
        }).execute()
        
        return {
            'status': 'completed',
            'image_url': generated_url,
            'image_id': result.data[0]['id']
        }
        
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e)
        }

def start_generation(task_id: int, product_image_url: str, image_type: str, angle: str, theme: str) -> str:
    """Start background generation job"""
    job_id = str(uuid.uuid4())
    
    job = queue.enqueue(
        process_generation,
        task_id,
        product_image_url,
        image_type,
        angle,
        theme,
        job_id=job_id,
        job_timeout='10m'
    )
    
    return job_id

def get_generation_status(job_id: str) -> dict:
    """Get status of generation job"""
    from rq.job import Job
    
    try:
        job = Job.fetch(job_id, connection=redis_conn)
        
        if job.is_finished:
            return {
                'status': 'completed',
                'result': job.result
            }
        elif job.is_failed:
            return {
                'status': 'failed',
                'error': str(job.exc_info)
            }
        else:
            return {
                'status': 'processing',
                'progress': job.meta.get('progress', 0)
            }
    except:
        return {
            'status': 'not_found'
        }
