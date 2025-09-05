#!/usr/bin/env python3
"""
Start script for the P2P File Sharing Backend API
"""
import os
import sys

# Add backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

# Change working directory to backend
os.chdir(backend_dir)

# Import and run the app
from app import app

if __name__ == '__main__':
    print("🚀 Starting P2P File Sharing Backend API...")
    print("📡 API Server: http://localhost:5000")
    print("🔌 TCP Server: localhost:8000")
    print("💡 API Documentation: http://localhost:5000")
    print()
    
    app.run(host='0.0.0.0', port=5000, debug=True)