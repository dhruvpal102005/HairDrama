@echo off
echo ========================================
echo TaskHub Backend Starter
echo ========================================
echo.

cd backend

echo Checking virtual environment...
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Installing/updating dependencies...
pip install -r requirements.txt --quiet

echo.
echo ========================================
echo Starting Flask Backend...
echo ========================================
echo Backend will run on: http://localhost:5000
echo Press Ctrl+C to stop
echo.

python app.py
