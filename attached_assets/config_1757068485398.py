import os

# Server configuration
FLASK_HOST = '0.0.0.0'
FLASK_PORT = 5000
TCP_HOST = '0.0.0.0'
TCP_PORT = 8000

# File sharing configuration
SHARED_FILES_DIR = os.path.join(os.path.dirname(__file__), 'shared_files')
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {
    'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 
    'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'mp3', 'mp4',
    'avi', 'mov', 'mkv', 'py', 'js', 'html', 'css'
}

# Transfer configuration
CHUNK_SIZE = 8192  # 8KB chunks for file transfer
TRANSFER_TIMEOUT = 300  # 5 minutes timeout for transfers

# Ensure shared files directory exists
os.makedirs(SHARED_FILES_DIR, exist_ok=True)
