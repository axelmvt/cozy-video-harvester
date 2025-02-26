FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Update ca-certificates
RUN update-ca-certificates

# Install the latest development version of yt-dlp from git
RUN pip uninstall -y yt-dlp || true
RUN git clone https://github.com/yt-dlp/yt-dlp.git /tmp/yt-dlp \
    && cd /tmp/yt-dlp \
    && pip install -e . \
    && cd / \
    && rm -rf /tmp/yt-dlp/.git

# Set environment variables to disable SSL verification
ENV PYTHONHTTPSVERIFY=0
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create downloads directory
RUN mkdir -p downloads

EXPOSE 5000

CMD ["python", "app.py"]
