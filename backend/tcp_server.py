import socket
import threading
import os
import json
import logging
from config import TCP_HOST, TCP_PORT, SHARED_FILES_DIR, CHUNK_SIZE
from file_manager import FileManager

class TCPFileServer:
    def __init__(self):
        self.host = TCP_HOST
        self.port = TCP_PORT
        self.socket = None
        self.file_manager = FileManager()
        self.active_transfers = {}
        self.running = False
        
    def start(self):
        """Start the TCP server"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.socket.bind((self.host, self.port))
            self.socket.listen(5)
            self.running = True
            
            logging.info(f"TCP File Server started on {self.host}:{self.port}")
            
            while self.running:
                try:
                    client_socket, client_address = self.socket.accept()
                    logging.info(f"New connection from {client_address}")
                    
                    # Handle client in a separate thread
                    client_thread = threading.Thread(
                        target=self.handle_client,
                        args=(client_socket, client_address),
                        daemon=True
                    )
                    client_thread.start()
                    
                except socket.error as e:
                    if self.running:
                        logging.error(f"Socket error: {e}")
                        
        except Exception as e:
            logging.error(f"Failed to start TCP server: {e}")
    
    def handle_client(self, client_socket, client_address):
        """Handle individual client connections"""
        try:
            while True:
                # Receive command from client
                data = client_socket.recv(1024).decode('utf-8')
                if not data:
                    break
                    
                try:
                    command = json.loads(data)
                    response = self.process_command(command, client_socket)
                    
                    # Send response back to client
                    if response:
                        client_socket.send(json.dumps(response).encode('utf-8'))
                        
                except json.JSONDecodeError:
                    error_response = {"status": "error", "message": "Invalid JSON command"}
                    client_socket.send(json.dumps(error_response).encode('utf-8'))
                    
        except Exception as e:
            logging.error(f"Error handling client {client_address}: {e}")
        finally:
            client_socket.close()
            logging.info(f"Connection closed for {client_address}")
    
    def process_command(self, command, client_socket):
        """Process commands from clients"""
        cmd_type = command.get('type')
        
        if cmd_type == 'list_files':
            return self.handle_list_files()
        elif cmd_type == 'download_file':
            return self.handle_download_file(command, client_socket)
        elif cmd_type == 'upload_file':
            return self.handle_upload_file(command, client_socket)
        elif cmd_type == 'ping':
            return {"status": "success", "message": "pong"}
        else:
            return {"status": "error", "message": "Unknown command"}
    
    def handle_list_files(self):
        """Return list of available files"""
        try:
            files = self.file_manager.list_files()
            return {
                "status": "success",
                "files": files
            }
        except Exception as e:
            logging.error(f"Error listing files: {e}")
            return {"status": "error", "message": str(e)}
    
    def handle_download_file(self, command, client_socket):
        """Handle file download requests"""
        filename = command.get('filename')
        if not filename:
            return {"status": "error", "message": "Filename required"}
        
        try:
            file_path = os.path.join(SHARED_FILES_DIR, filename)
            if not os.path.exists(file_path):
                return {"status": "error", "message": "File not found"}
            
            file_size = os.path.getsize(file_path)
            
            # Send file metadata first
            metadata = {
                "status": "success",
                "filename": filename,
                "size": file_size
            }
            client_socket.send(json.dumps(metadata).encode('utf-8'))
            
            # Wait for client acknowledgment
            ack = client_socket.recv(1024).decode('utf-8')
            if ack != "ready":
                return {"status": "error", "message": "Client not ready"}
            
            # Send file data
            with open(file_path, 'rb') as f:
                bytes_sent = 0
                while bytes_sent < file_size:
                    chunk = f.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    client_socket.send(chunk)
                    bytes_sent += len(chunk)
            
            logging.info(f"File {filename} sent successfully ({bytes_sent} bytes)")
            return None  # Response already sent
            
        except Exception as e:
            logging.error(f"Error downloading file {filename}: {e}")
            return {"status": "error", "message": str(e)}
    
    def handle_upload_file(self, command, client_socket):
        """Handle file upload requests"""
        filename = command.get('filename')
        file_size = command.get('size')
        
        if not filename or not file_size:
            return {"status": "error", "message": "Filename and size required"}
        
        try:
            file_path = os.path.join(SHARED_FILES_DIR, filename)
            
            # Send ready signal
            client_socket.send("ready".encode('utf-8'))
            
            # Receive file data
            with open(file_path, 'wb') as f:
                bytes_received = 0
                while bytes_received < file_size:
                    chunk = client_socket.recv(min(CHUNK_SIZE, file_size - bytes_received))
                    if not chunk:
                        break
                    f.write(chunk)
                    bytes_received += len(chunk)
            
            if bytes_received == file_size:
                logging.info(f"File {filename} received successfully ({bytes_received} bytes)")
                return {"status": "success", "message": "File uploaded successfully"}
            else:
                os.remove(file_path)  # Remove incomplete file
                return {"status": "error", "message": "Incomplete file transfer"}
                
        except Exception as e:
            logging.error(f"Error uploading file {filename}: {e}")
            return {"status": "error", "message": str(e)}
    
    def stop(self):
        """Stop the TCP server"""
        self.running = False
        if self.socket:
            self.socket.close()
