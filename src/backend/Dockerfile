# Use a lightweight Python base image
FROM python:3.12-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies for WeasyPrint + standard fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libharfbuzz-subset0 \
    libcairo2 \
    libffi-dev \
    libjpeg-dev \
    libopenjp2-7-dev \
    shared-mime-info \
    fontconfig \
    fonts-liberation \
    fonts-dejavu-core \
    fonts-noto-core \
    && rm -rf /var/lib/apt/lists/* \
    && fc-cache -fv

# Copy python requirements file
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
COPY . .

# Render defaults PORT to 10000; local containers can override it.
EXPOSE 10000

# Start FastAPI application using uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
