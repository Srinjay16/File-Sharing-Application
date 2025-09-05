#!/usr/bin/env python3
"""
Start both backend and frontend servers for P2P File Sharing
"""
import subprocess
import sys
import os
import time
import signal

def start_both_servers():
    print("🚀 Starting P2P File Sharing Application...")
    print("=" * 50)
    
    # Start backend in a separate process
    print("📡 Starting Backend API Server...")
    backend_process = subprocess.Popen([
        sys.executable, 'start_backend.py'
    ], cwd=os.path.dirname(__file__))
    
    # Wait a moment for backend to start
    time.sleep(3)
    
    # Start frontend in a separate process
    print("🌐 Starting Frontend Server...")
    frontend_process = subprocess.Popen([
        sys.executable, 'start_frontend.py'
    ], cwd=os.path.dirname(__file__))
    
    def signal_handler(sig, frame):
        print("\n🛑 Shutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("✅ Servers stopped")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Wait for both processes
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == '__main__':
    start_both_servers()