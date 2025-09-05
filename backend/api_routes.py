import os
import json
from flask import request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from app import app
from file_manager import FileManager
from peer_discovery import PeerDiscovery
from config import SHARED_FILES_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE

# Initialize managers
file_manager = FileManager()
peer_discovery = PeerDiscovery()

@app.route('/')
def index():
    """Main web interface"""
    from flask import render_template
    return render_template('index.html')

@app.route('/api')
def api_info():
    """API information endpoint"""
    return jsonify({
        'name': 'P2P File Sharing API',
        'version': '1.0.0',
        'description': 'Backend API for peer-to-peer file sharing',
        'endpoints': {
            'health': '/api/health',
            'files': '/api/files',
            'upload': '/api/files/upload',
            'download': '/api/files/download/<filename>',
            'delete': '/api/files/delete/<filename>',
            'peers': '/api/peers',
            'add_peer': '/api/peers/add',
            'remove_peer': '/api/peers/remove/<peer_id>',
            'test_peer': '/api/peers/test/<peer_id>',
            'peer_files': '/api/peers/<peer_id>/files',
            'download_from_peer': '/api/peers/download',
            'refresh_peers': '/api/peers/refresh',
            'stats': '/api/stats'
        }
    })

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'P2P File Sharing API is running'
    })

@app.route('/api/files')
def api_list_files():
    """Get list of all files"""
    try:
        files = file_manager.list_files()
        return jsonify({
            'success': True,
            'files': files,
            'count': len(files)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error listing files: {str(e)}'
        }), 500

@app.route('/api/files/upload', methods=['POST'])
def api_upload_file():
    """Handle file upload"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            
            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size > MAX_FILE_SIZE:
                return jsonify({
                    'success': False,
                    'message': f'File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB'
                }), 400
            
            # Save file
            file_path = os.path.join(SHARED_FILES_DIR, filename)
            file.save(file_path)
            
            return jsonify({
                'success': True,
                'message': f'File {filename} uploaded successfully',
                'filename': filename
            })
        else:
            return jsonify({
                'success': False,
                'message': 'File type not allowed'
            }), 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Upload failed: {str(e)}'
        }), 500

@app.route('/api/files/download/<filename>')
def api_download_file(filename):
    """Download a file"""
    try:
        return send_from_directory(SHARED_FILES_DIR, filename)
    except FileNotFoundError:
        return jsonify({
            'success': False,
            'message': 'File not found'
        }), 404

@app.route('/api/files/delete/<filename>', methods=['DELETE'])
def api_delete_file(filename):
    """Delete a file"""
    try:
        success, message = file_manager.remove_file(filename)
        return jsonify({
            'success': success,
            'message': message
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Delete failed: {str(e)}'
        }), 500

@app.route('/api/peers')
def api_list_peers():
    """Get list of all peers"""
    try:
        peers = peer_discovery.get_peers()
        active_peers = peer_discovery.get_active_peers()
        return jsonify({
            'success': True,
            'peers': peers,
            'active_peers': active_peers,
            'total_peers': len(peers),
            'active_count': len(active_peers)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error listing peers: {str(e)}'
        }), 500

@app.route('/api/peers/add', methods=['POST'])
def api_add_peer():
    """Add a new peer"""
    try:
        data = request.get_json()
        peer_ip = data.get('ip', '').strip()
        peer_port = data.get('port', '').strip()
        peer_name = data.get('name', '').strip()
        
        if not peer_ip or not peer_port:
            return jsonify({
                'success': False,
                'message': 'IP address and port are required'
            }), 400
        
        peer_port = int(peer_port)
        peer_id = peer_discovery.add_peer(peer_ip, peer_port, peer_name)
        
        return jsonify({
            'success': True,
            'message': f'Peer {peer_id} added successfully',
            'peer_id': peer_id
        })
    
    except ValueError:
        return jsonify({
            'success': False,
            'message': 'Invalid port number'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error adding peer: {str(e)}'
        }), 500

@app.route('/api/peers/remove/<peer_id>', methods=['DELETE'])
def api_remove_peer(peer_id):
    """Remove a peer"""
    try:
        success = peer_discovery.remove_peer(peer_id)
        if success:
            return jsonify({
                'success': True,
                'message': f'Peer {peer_id} removed successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Peer not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error removing peer: {str(e)}'
        }), 500

@app.route('/api/peers/test/<peer_id>', methods=['POST'])
def api_test_peer(peer_id):
    """Test connection to a peer"""
    try:
        peer_discovery.test_peer_connection(peer_id)
        return jsonify({
            'success': True,
            'message': f'Testing connection to {peer_id}...'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error testing peer: {str(e)}'
        }), 500

@app.route('/api/peers/<peer_id>/files')
def api_get_peer_files(peer_id):
    """Get files from a peer"""
    try:
        files = peer_discovery.get_peer_files(peer_id)
        return jsonify({
            'success': True,
            'files': files,
            'count': len(files)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting peer files: {str(e)}'
        }), 500

@app.route('/api/peers/download', methods=['POST'])
def api_download_from_peer():
    """Download file from peer"""
    try:
        data = request.get_json()
        peer_id = data.get('peer_id')
        filename = data.get('filename')
        
        if not peer_id or not filename:
            return jsonify({
                'success': False,
                'message': 'Peer ID and filename required'
            }), 400
        
        # Save to shared directory
        save_path = os.path.join(SHARED_FILES_DIR, filename)
        
        success, message = peer_discovery.download_file_from_peer(peer_id, filename, save_path)
        
        return jsonify({
            'success': success,
            'message': message
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Download failed: {str(e)}'
        }), 500

@app.route('/api/peers/refresh', methods=['POST'])
def api_refresh_peers():
    """Refresh peer status"""
    try:
        peers = peer_discovery.get_peers()
        for peer_id in peers:
            peer_discovery.test_peer_connection(peer_id)
        
        return jsonify({
            'success': True,
            'message': 'Refreshing peer status...'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error refreshing peers: {str(e)}'
        }), 500

@app.route('/api/stats')
def api_get_stats():
    """Get application statistics"""
    try:
        files = file_manager.list_files()
        peers = peer_discovery.get_peers()
        active_peers = peer_discovery.get_active_peers()
        
        total_size = sum(file.get('size', 0) for file in files)
        
        return jsonify({
            'success': True,
            'stats': {
                'total_files': len(files),
                'total_file_size': total_size,
                'total_file_size_human': file_manager.format_file_size(total_size),
                'total_peers': len(peers),
                'active_peers': len(active_peers),
                'server_status': 'running'
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting stats: {str(e)}'
        }), 500

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
