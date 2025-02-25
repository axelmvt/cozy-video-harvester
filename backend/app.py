import os
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
from pathlib import Path
import time

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:8080", "http://frontend:8080"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
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
        print("Received download request with data:", request.json)
        data = request.json
        url = data.get('url')
        format_type = data.get('format', 'mp4')
        download_type = data.get('type', 'video')
        quality = data.get('quality', 'best')
        direct_download = data.get('direct_download', False)

        if not url:
            return jsonify({"error": "URL is required"}), 400

        # Configure yt-dlp options
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' if download_type == 'video' else 'bestaudio[ext=mp3]/best',
            'outtmpl': str(DOWNLOAD_DIR / '%(title)s.%(ext)s'),
            'keepvideo': True,
        }

        if quality != 'best':
            ydl_opts['format'] = f'bestvideo[height<={quality}]+bestaudio/best[height<={quality}]'

        if download_type == 'audio':
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }]

        # Clean up old files
        cleanup_old_files()

        # Download video
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Get video info first
            info = ydl.extract_info(url, download=False)
            title = get_safe_filename(info['title'])
            
            # Check if file already exists
            existing_file = None
            for ext in [format_type, 'mp4', 'mp3']:
                potential_file = DOWNLOAD_DIR / f"{title}.{ext}"
                if potential_file.exists():
                    existing_file = potential_file
                    break
            
            if not existing_file:
                # Download if file doesn't exist
                info = ydl.extract_info(url, download=True)
                title = get_safe_filename(info['title'])
                ext = 'mp3' if download_type == 'audio' else format_type
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
                    "type": download_type
                })

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

if __name__ == '__main__':
    # Add a delay to ensure the server is ready
    time.sleep(5)
    app.run(debug=True, host='0.0.0.0', port=5000)
