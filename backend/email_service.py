import os
import resend
from typing import Dict, Any

resend.api_key = os.getenv('RESEND_API_KEY')

def send_task_assigned_email(to_email: str, user_name: str, task: Dict[str, Any]):
    """Send email when task is assigned to user"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .task-details {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 New Task Assigned</h1>
            </div>
            <div class="content">
                <p>Hi {user_name},</p>
                <p>You have been assigned a new task on TaskHub!</p>
                
                <div class="task-details">
                    <h3>{task['title']}</h3>
                    <p>{task.get('description', 'No description provided')}</p>
                    <p><strong>Status:</strong> {task['status']}</p>
                </div>
                
                <p>Click the button below to view and start working on your task:</p>
                <a href="{os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')}/tasks/{task['id']}" class="button">
                    View Task
                </a>
                
                <p>Remember to generate all 8 required images before submitting!</p>
                <p>Best regards,<br>TaskHub Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        resend.Emails.send({
            "from": "TaskHub <onboarding@resend.dev>",
            "to": to_email,
            "subject": f"New Task Assigned: {task['title']}",
            "html": html_content
        })
    except Exception as e:
        print(f"Error sending email: {e}")

def send_task_submitted_email(to_email: str, admin_name: str, task: Dict[str, Any]):
    """Send email when user submits task"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .task-details {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Task Completed</h1>
            </div>
            <div class="content">
                <p>Hi {admin_name},</p>
                <p>A task has been completed and submitted for your review!</p>
                
                <div class="task-details">
                    <h3>{task['title']}</h3>
                    <p><strong>Status:</strong> Submitted</p>
                    <p><strong>Submitted at:</strong> {task.get('submitted_at', 'Just now')}</p>
                </div>
                
                <p>Click the button below to review the submitted images:</p>
                <a href="{os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')}/admin/tasks/{task['id']}" class="button">
                    Review Task
                </a>
                
                <p>You can accept the task or request revisions.</p>
                <p>Best regards,<br>TaskHub Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        resend.Emails.send({
            "from": "TaskHub <onboarding@resend.dev>",
            "to": to_email,
            "subject": f"Task Completed: {task['title']}",
            "html": html_content
        })
    except Exception as e:
        print(f"Error sending email: {e}")

def send_task_accepted_email(to_email: str, user_name: str, task: Dict[str, Any]):
    """Send email when admin accepts task"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .success {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Task Accepted!</h1>
            </div>
            <div class="content">
                <p>Hi {user_name},</p>
                <p>Great news! Your submitted task has been accepted.</p>
                
                <div class="success">
                    <h3>{task['title']}</h3>
                    <p><strong>Status:</strong> Accepted ✓</p>
                </div>
                
                <p>Excellent work on maintaining product consistency across all generated images!</p>
                <p>Keep up the great work!</p>
                <p>Best regards,<br>TaskHub Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        resend.Emails.send({
            "from": "TaskHub <onboarding@resend.dev>",
            "to": to_email,
            "subject": f"Task Accepted: {task['title']}",
            "html": html_content
        })
    except Exception as e:
        print(f"Error sending email: {e}")
