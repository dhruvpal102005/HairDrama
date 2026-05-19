@echo off
echo ========================================
echo TaskHub Worker Starter
echo ========================================
echo.

cd backend

echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo ========================================
echo Starting Background Worker...
echo ========================================
echo Worker will process AI generation jobs
echo Press Ctrl+C to stop
echo.

python worker.py
