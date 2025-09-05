import os
import hashlib
import mimetypes
from datetime import datetime
from config import SHARED_FILES_DIR, ALLOWED_EXTENSIONS

class FileManager:
    def __init__(self):
        self.shared_dir = SHARED_FILES_DIR
        
    def list_files(self):
        """Get list of all files in shared directory with metadata"""
        files = []
        
        try:
            for filename in os.listdir(self.shared_dir):
                file_path = os.path.join(self.shared_dir, filename)
                
                if os.path.isfile(file_path):
                    file_info = self.get_file_info(filename)
                    if file_info:
                        files.append(file_info)
                        
        except Exception as e:
            print(f"Error listing files: {e}")
            
        return files
    
    def get_file_info(self, filename):
        """Get detailed information about a file"""
        try:
            file_path = os.path.join(self.shared_dir, filename)
            
            if not os.path.exists(file_path):
                return None
                
            stat = os.stat(file_path)
            
            return {
                'name': filename,
                'size': stat.st_size,
                'size_human': self.format_file_size(stat.st_size),
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'modified_human': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                'type': mimetypes.guess_type(filename)[0] or 'application/octet-stream',
                'extension': os.path.splitext(filename)[1].lower(),
                'hash': self.get_file_hash(file_path)
            }
        except Exception as e:
            print(f"Error getting file info for {filename}: {e}")
            return None
    
    def get_file_hash(self, file_path):
        """Calculate MD5 hash of file"""
        try:
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception:
            return None
    
    def format_file_size(self, size_bytes):
        """Convert bytes to human readable format"""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        while size_bytes >= 1024 and i < len(size_names) - 1:
            size_bytes /= 1024.0
            i += 1
        
        return f"{size_bytes:.1f} {size_names[i]}"
    
    def is_allowed_file(self, filename):
        """Check if file extension is allowed"""
        extension = os.path.splitext(filename)[1].lower().lstrip('.')
        return extension in ALLOWED_EXTENSIONS
    
    def add_file(self, filename, file_data):
        """Add a new file to shared directory"""
        try:
            if not self.is_allowed_file(filename):
                return False, "File type not allowed"
                
            file_path = os.path.join(self.shared_dir, filename)
            
            with open(file_path, 'wb') as f:
                f.write(file_data)
                
            return True, "File added successfully"
            
        except Exception as e:
            return False, f"Error adding file: {e}"
    
    def remove_file(self, filename):
        """Remove a file from shared directory"""
        try:
            file_path = os.path.join(self.shared_dir, filename)
            
            if os.path.exists(file_path):
                os.remove(file_path)
                return True, "File removed successfully"
            else:
                return False, "File not found"
                
        except Exception as e:
            return False, f"Error removing file: {e}"
