#!/usr/bin/env python3
"""
Start script for the P2P File Sharing Frontend
Simple HTTP server to serve static files
"""
import os
import http.server
import socketserver
import webbrowser
import threading
import time

def start_server():
    # Change to frontend directory
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    os.chdir(frontend_dir)
    
    PORT = 3000
    
    class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            super().end_headers()
    
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("🌐 Starting P2P File Sharing Frontend...")
        print(f"📱 Frontend Server: http://localhost:{PORT}")
        print("🔗 Make sure Backend API is running on http://localhost:5000")
        print()
        print("✨ Opening browser in 2 seconds...")
        
        # Open browser after a short delay
        def open_browser():
            time.sleep(2)
            webbrowser.open(f'http://localhost:{PORT}')
        
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Frontend server stopped")

if __name__ == '__main__':
    start_server()
