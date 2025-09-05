import os
import json
from flask import render_template, request, jsonify, redirect, url_for, flash, send_from_directory
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
    """Main dashboard"""
    files = file_manager.list_files()
    peers = peer_discovery.get_peers()
    active_peers = peer_discovery.get_active_peers()
    
    return render_template('index.html', 
                         files=files[:5],  # Show only first 5 files
                         peers=peers,
                         active_peers=active_peers,
                         total_files=len(files))

@app.route('/files')
def files():
    """File management page"""
    files = file_manager.list_files()
    return render_template('files.html', files=files)

@app.route('/peers')
def peers():
    """Peer management page"""
    peers = peer_discovery.get_peers()
    active_peers = peer_discovery.get_active_peers()
    return render_template('peers.html', peers=peers, active_peers=active_peers)

@app.route('/transfers')
def transfers():
    """Transfer monitoring page"""
    # This would show active transfers in a real implementation
    return render_template('transfers.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload"""
    if 'file' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('files'))
    
    file = request.files['file']
    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('files'))
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            flash(f'File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB', 'error')
            return redirect(url_for('files'))
        
        # Save file
        file_path = os.path.join(SHARED_FILES_DIR, filename)
        file.save(file_path)
        
        flash(f'File {filename} uploaded successfully', 'success')
    else:
        flash('File type not allowed', 'error')
    
    return redirect(url_for('files'))

@app.route('/download/<filename>')
def download_file(filename):
    """Download a file"""
    try:
        return send_from_directory(SHARED_FILES_DIR, filename)
    except FileNotFoundError:
        flash('File not found', 'error')
        return redirect(url_for('files'))

@app.route('/delete/<filename>', methods=['POST'])
def delete_file(filename):
    """Delete a file"""
    success, message = file_manager.remove_file(filename)
    if success:
        flash(message, 'success')
    else:
        flash(message, 'error')
    return redirect(url_for('files'))

@app.route('/add_peer', methods=['POST'])
def add_peer():
    """Add a new peer"""
    peer_ip = request.form.get('peer_ip', '').strip()
    peer_port = request.form.get('peer_port', '').strip()
    peer_name = request.form.get('peer_name', '').strip()
    
    if not peer_ip or not peer_port:
        flash('IP address and port are required', 'error')
        return redirect(url_for('peers'))
    
    try:
        peer_port = int(peer_port)
        peer_id = peer_discovery.add_peer(peer_ip, peer_port, peer_name)
        flash(f'Peer {peer_id} added successfully', 'success')
    except ValueError:
        flash('Invalid port number', 'error')
    except Exception as e:
        flash(f'Error adding peer: {e}', 'error')
    
    return redirect(url_for('peers'))

@app.route('/remove_peer/<peer_id>', methods=['POST'])
def remove_peer(peer_id):
    """Remove a peer"""
    if peer_discovery.remove_peer(peer_id):
        flash(f'Peer {peer_id} removed successfully', 'success')
    else:
        flash('Peer not found', 'error')
    return redirect(url_for('peers'))

@app.route('/test_peer/<peer_id>')
def test_peer(peer_id):
    """Test connection to a peer"""
    peer_discovery.test_peer_connection(peer_id)
    flash(f'Testing connection to {peer_id}...', 'info')
    return redirect(url_for('peers'))

@app.route('/api/peer_files/<peer_id>')
def api_peer_files(peer_id):
    """API endpoint to get files from a peer"""
    files = peer_discovery.get_peer_files(peer_id)
    return jsonify({'files': files})

@app.route('/api/download_from_peer', methods=['POST'])
def api_download_from_peer():
    """API endpoint to download file from peer"""
    data = request.get_json()
    peer_id = data.get('peer_id')
    filename = data.get('filename')
    
    if not peer_id or not filename:
        return jsonify({'success': False, 'message': 'Peer ID and filename required'})
    
    # Save to shared directory
    save_path = os.path.join(SHARED_FILES_DIR, filename)
    
    success, message = peer_discovery.download_file_from_peer(peer_id, filename, save_path)
    
    return jsonify({'success': success, 'message': message})

@app.route('/api/refresh_peers')
def api_refresh_peers():
    """API endpoint to refresh peer status"""
    peers = peer_discovery.get_peers()
    for peer_id in peers:
        peer_discovery.test_peer_connection(peer_id)
    
    return jsonify({'success': True, 'message': 'Refreshing peer status...'})

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
