import socket
import json
import threading
import time
import logging
from datetime import datetime, timedelta

class PeerDiscovery:
    def __init__(self):
        self.peers = {}  # {peer_id: {ip, port, last_seen, status}}
        self.lock = threading.Lock()
        
    def add_peer(self, peer_ip, peer_port, peer_name=None):
        """Manually add a peer"""
        peer_id = f"{peer_ip}:{peer_port}"
        
        with self.lock:
            self.peers[peer_id] = {
                'ip': peer_ip,
                'port': peer_port,
                'name': peer_name or peer_id,
                'last_seen': datetime.now(),
                'status': 'unknown',
                'files': []
            }
        
        # Test connection to peer
        self.test_peer_connection(peer_id)
        
        return peer_id
    
    def remove_peer(self, peer_id):
        """Remove a peer"""
        with self.lock:
            if peer_id in self.peers:
                del self.peers[peer_id]
                return True
        return False
    
    def get_peers(self):
        """Get list of all peers"""
        with self.lock:
            return dict(self.peers)
    
    def get_active_peers(self):
        """Get list of active peers (responded to ping within last 5 minutes)"""
        cutoff_time = datetime.now() - timedelta(minutes=5)
        
        with self.lock:
            active_peers = {
                peer_id: peer_info 
                for peer_id, peer_info in self.peers.items()
                if peer_info['last_seen'] > cutoff_time and peer_info['status'] == 'online'
            }
        
        return active_peers
    
    def test_peer_connection(self, peer_id):
        """Test connection to a peer"""
        def test_connection():
            try:
                peer_info = self.peers.get(peer_id)
                if not peer_info:
                    return
                
                # Create socket and connect
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)  # 5 second timeout
                
                sock.connect((peer_info['ip'], peer_info['port']))
                
                # Send ping command
                ping_command = json.dumps({"type": "ping"})
                sock.send(ping_command.encode('utf-8'))
                
                # Wait for response
                response = sock.recv(1024).decode('utf-8')
                response_data = json.loads(response)
                
                sock.close()
                
                if response_data.get('status') == 'success':
                    with self.lock:
                        if peer_id in self.peers:
                            self.peers[peer_id]['status'] = 'online'
                            self.peers[peer_id]['last_seen'] = datetime.now()
                    logging.info(f"Peer {peer_id} is online")
                else:
                    with self.lock:
                        if peer_id in self.peers:
                            self.peers[peer_id]['status'] = 'error'
                    logging.warning(f"Peer {peer_id} responded with error")
                    
            except Exception as e:
                with self.lock:
                    if peer_id in self.peers:
                        self.peers[peer_id]['status'] = 'offline'
                logging.warning(f"Peer {peer_id} is offline: {e}")
        
        # Run connection test in separate thread
        thread = threading.Thread(target=test_connection, daemon=True)
        thread.start()
    
    def get_peer_files(self, peer_id):
        """Get list of files from a peer"""
        try:
            peer_info = self.peers.get(peer_id)
            if not peer_info:
                return []
            
            # Create socket and connect
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)  # 10 second timeout
            
            sock.connect((peer_info['ip'], peer_info['port']))
            
            # Send list_files command
            command = json.dumps({"type": "list_files"})
            sock.send(command.encode('utf-8'))
            
            # Wait for response
            response = sock.recv(4096).decode('utf-8')
            response_data = json.loads(response)
            
            sock.close()
            
            if response_data.get('status') == 'success':
                files = response_data.get('files', [])
                
                # Update peer's file list
                with self.lock:
                    if peer_id in self.peers:
                        self.peers[peer_id]['files'] = files
                        self.peers[peer_id]['last_seen'] = datetime.now()
                
                return files
            else:
                logging.error(f"Error getting files from peer {peer_id}: {response_data.get('message')}")
                return []
                
        except Exception as e:
            logging.error(f"Error connecting to peer {peer_id}: {e}")
            return []
    
    def download_file_from_peer(self, peer_id, filename, save_path):
        """Download a file from a peer"""
        try:
            peer_info = self.peers.get(peer_id)
            if not peer_info:
                return False, "Peer not found"
            
            # Create socket and connect
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(30)  # 30 second timeout
            
            sock.connect((peer_info['ip'], peer_info['port']))
            
            # Send download command
            command = json.dumps({
                "type": "download_file",
                "filename": filename
            })
            sock.send(command.encode('utf-8'))
            
            # Receive file metadata
            metadata_response = sock.recv(1024).decode('utf-8')
            metadata = json.loads(metadata_response)
            
            if metadata.get('status') != 'success':
                sock.close()
                return False, metadata.get('message', 'Unknown error')
            
            file_size = metadata.get('size', 0)
            
            # Send ready signal
            sock.send("ready".encode('utf-8'))
            
            # Receive file data
            with open(save_path, 'wb') as f:
                bytes_received = 0
                while bytes_received < file_size:
                    chunk = sock.recv(min(8192, file_size - bytes_received))
                    if not chunk:
                        break
                    f.write(chunk)
                    bytes_received += len(chunk)
            
            sock.close()
            
            if bytes_received == file_size:
                logging.info(f"Successfully downloaded {filename} from {peer_id}")
                return True, "File downloaded successfully"
            else:
                os.remove(save_path)  # Remove incomplete file
                return False, "Incomplete file transfer"
                
        except Exception as e:
            logging.error(f"Error downloading file from peer {peer_id}: {e}")
            return False, str(e)
