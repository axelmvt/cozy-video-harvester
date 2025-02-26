FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install the latest version of yt-dlp
RUN pip install --upgrade yt-dlp

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create downloads directory
RUN mkdir -p downloads

# Install ca-certificates
RUN apt-get update && apt-get install -y ca-certificates && update-ca-certificates

EXPOSE 5000

CMD ["python", "app.py"]
