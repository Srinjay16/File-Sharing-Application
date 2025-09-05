#!/usr/bin/env python3
"""
Legacy main.py - now redirects to separated architecture
For the new separated architecture, use:
- start_backend.py for backend API only
- start_frontend.py for frontend only  
- start_both.py for both servers
"""
import os
import sys

# Add backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

# Change working directory to backend
os.chdir(backend_dir)

# Import and run the backend app
from app import app

if __name__ == '__main__':
    print("⚠️  Using legacy main.py")
    print("💡 For separated architecture, use:")
    print("   - python start_backend.py (Backend API only)")
    print("   - python start_frontend.py (Frontend only)")
    print("   - python start_both.py (Both servers)")
    print()
    print("🚀 Starting Backend API...")
    
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)

