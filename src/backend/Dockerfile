# Use the official Microsoft Playwright Python base image
# This contains Python, Playwright, and all system dependencies for Chromium pre-installed.
FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

# Set working directory inside the container
WORKDIR /app

# Copy python requirements file
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
COPY . .

# Expose port 8000 (standard for FastAPI backend)
EXPOSE 8000

# Start FastAPI application using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
