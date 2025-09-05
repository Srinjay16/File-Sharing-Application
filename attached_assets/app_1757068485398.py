import os
import logging
import threading
from flask import Flask

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

# Import routes after app creation to avoid circular imports
from routes import *
from tcp_server import TCPFileServer

# Start the TCP server in a separate thread
def start_tcp_server():
    tcp_server = TCPFileServer()
    tcp_server.start()

# Start TCP server thread when Flask app starts
tcp_thread = threading.Thread(target=start_tcp_server, daemon=True)
tcp_thread.start()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
