import os
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
from pathlib import Path
import time
import socket
import sys
import platform

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["*"],  # Allow all origins for debugging
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "expose_headers": ["Content-Type", "X-CSRFToken"],
        "supports_credentials": True,
        "max_age": 86400
    }
})

# Configure download directory
DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(exist_ok=True)

@app.route('/')
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running"}), 200

def cleanup_old_files():
    """Remove files older than 24 hours"""
    now = datetime.now()
    for file_path in DOWNLOAD_DIR.glob("*"):
        file_age = datetime.fromtimestamp(file_path.stat().st_mtime)
        if now - file_age > timedelta(hours=24):
            file_path.unlink()

def get_safe_filename(title):
    """Convert title to safe filename"""
    return "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()

@app.route('/download', methods=['POST'])
def download_video():
    try:
        print("Received download request with headers:", request.headers)
        print("Received download request with data:", request.json)
        
        # Validate request content type
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON data"}), 400

        url = data.get('url')
        format_type = data.get('format', 'mp4')
        download_type = data.get('type', 'video')
        quality = data.get('quality', 'best')
        direct_download = data.get('direct_download', False)

        if not url:
            return jsonify({"error": "URL is required"}), 400

        # Try different format strings based on the video type
        formats = []
        if download_type == 'video':
            formats = [
                'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                'bestvideo+bestaudio/best',
                'b'  # Shorthand for best
            ]
        else:
            formats = [
                'bestaudio[ext=mp3]/bestaudio/best',
                'ba'  # Shorthand for best audio
            ]

        # Clean up old files
        cleanup_old_files()

        # Try each format until one works
        for format_string in formats:
            try:
                # Configure yt-dlp options with additional bypass options
                ydl_opts = {
                    'format': format_string,
                    'outtmpl': str(DOWNLOAD_DIR / '%(title)s.%(ext)s'),
                    'keepvideo': True,
                    # Add additional options to bypass restrictions
                    'nocheckcertificate': True,
                    'ignoreerrors': True,
                    'no_warnings': True,
                    'quiet': False,
                    'verbose': True,
                    'geo_bypass': True,
                    'extractor_retries': 5,
                    'socket_timeout': 30,
                    # Use a more modern user agent
                    'http_headers': {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Sec-Fetch-Mode': 'navigate',
                    },
                    # Force use of the regular webpage
                    'compat_opts': ['no-youtube-unavailable-videos'],
                    'verify_ssl': False,  # Additional option to disable SSL verification
                }

                if quality != 'best' and download_type == 'video':
                    if quality.isdigit():
                        ydl_opts['format'] = f'bestvideo[height<={quality}]+bestaudio/best[height<={quality}]'
                    
                if download_type == 'audio':
                    ydl_opts['postprocessors'] = [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '192',
                    }]

                # Try to download
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    # Get video info first without downloading
                    print(f"Trying format: {format_string}")
                    info = ydl.extract_info(url, download=False)
                    title = get_safe_filename(info['title'])
                    
                    # Check if file already exists
                    existing_file = None
                    for ext in [format_type, 'mp4', 'webm', 'mp3']:
                        potential_file = DOWNLOAD_DIR / f"{title}.{ext}"
                        if potential_file.exists():
                            existing_file = potential_file
                            break
                    
                    if not existing_file:
                        # Download if file doesn't exist
                        info = ydl.extract_info(url, download=True)
                        title = get_safe_filename(info['title'])
                        
                        # Determine the extension based on the downloaded file
                        if download_type == 'audio':
                            ext = 'mp3'
                        else:
                            ext = info.get('ext', format_type)
                            
                        existing_file = DOWNLOAD_DIR / f"{title}.{ext}"

                    if direct_download:
                        return jsonify({
                            "download_url": f"/download/{existing_file.name}",
                            "title": title
                        })
                    else:
                        return jsonify({
                            "title": title,
                            "format": format_type,
                            "type": download_type,
                            "download_url": f"/download-file/{os.path.basename(existing_file)}"
                        })
            except Exception as e:
                print(f"Error with format {format_string}: {str(e)}")
                last_error = e
                continue  # Try the next format
        
        # If we get here, all formats failed
        return jsonify({"error": f"Failed to download video with all format options. Last error: {str(last_error)}"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download/<filename>')
def serve_file(filename):
    """Serve the downloaded file"""
    try:
        return send_file(
            DOWNLOAD_DIR / filename,
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/test', methods=['POST'])
def test_endpoint():
    try:
        print("Test request received with headers:", request.headers)
        print("Test request received with data:", request.json)
        return jsonify({"status": "success", "message": "Test endpoint works"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "success", "message": "pong"}), 200

@app.route('/version')
def version():
    """Return information about yt-dlp version and system"""
    try:
        with yt_dlp.YoutubeDL() as ydl:
            version_info = ydl.extract_info("https://www.youtube.com/watch?v=jNQXAC9IVRw", download=False, process=False)
            return jsonify({
                "yt_dlp_version": yt_dlp.version.__version__,
                "python_version": sys.version,
                "platform": platform.platform(),
                "extractor": version_info.get('extractor', 'Unknown'),
                "extractor_key": version_info.get('extractor_key', 'Unknown')
            }), 200
    except Exception as e:
        return jsonify({"error": str(e), "yt_dlp_version": yt_dlp.version.__version__}), 500

@app.route('/update-ytdlp', methods=['POST'])
def update_ytdlp():
    """Update yt-dlp to the latest version"""
    try:
        import subprocess
        result = subprocess.run(
            ["pip", "install", "--upgrade", "yt-dlp"],
            capture_output=True,
            text=True,
            check=True
        )
        # Reload the yt-dlp module to use the updated version
        import importlib
        importlib.reload(yt_dlp)
        return jsonify({
            "message": "yt-dlp updated successfully",
            "output": result.stdout,
            "new_version": yt_dlp.version.__version__
        }), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"error": str(e), "output": e.stdout, "error_output": e.stderr}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/network-test')
def network_test():
    # Get information about our environment
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    # Try to resolve the frontend hostname
    frontend_ip = None
    try:
        frontend_ip = socket.gethostbyname('frontend')
    except socket.gaierror:
        frontend_ip = "Could not resolve frontend hostname"
    
    return jsonify({
        "backend_ip": request.remote_addr,
        "backend_hostname": hostname,
        "backend_local_ip": local_ip,
        "frontend_ip_from_backend": frontend_ip,
        "headers": dict(request.headers),
        "environment": {
            "FLASK_ENV": os.environ.get("FLASK_ENV", "Not set"),
            "FLASK_DEBUG": os.environ.get("FLASK_DEBUG", "Not set")
        }
    }), 200

@app.before_request
def log_request_info():
    print(f"Request from: {request.remote_addr}")
    print(f"Headers: {request.headers}")
    print(f"Method: {request.method}")
    print(f"Path: {request.path}")
    if request.data:
        print(f"Body: {request.get_data()}")

@app.route('/download-file/<filename>')
def download_file(filename):
    return send_file(f'downloads/{filename}', as_attachment=True)

if __name__ == '__main__':
    # Add a delay to ensure the server is ready
    time.sleep(5)
    app.run(debug=True, host='0.0.0.0', port=5000)
