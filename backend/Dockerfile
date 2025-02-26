FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Update CA certificates
RUN update-ca-certificates --fresh

# Set environment variables to disable SSL verification
ENV PYTHONHTTPSVERIFY=0
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

# Configure Python to ignore SSL verification by default
RUN echo "import ssl; ssl._create_default_https_context = ssl._create_unverified_context" > /usr/local/lib/python3.11/site-packages/sitecustomize.py

# Completely uninstall any existing yt-dlp
RUN pip uninstall -y yt-dlp || true

# Install latest yt-dlp from GitHub master
RUN pip install --no-cache-dir --force-reinstall git+https://github.com/yt-dlp/yt-dlp.git@master

# Verify the installed version
RUN python -c "import yt_dlp; print(f'Installed yt-dlp version: {yt_dlp.version.__version__}')"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create downloads directory
RUN mkdir -p downloads

EXPOSE 5000

CMD ["python", "app.py"]
