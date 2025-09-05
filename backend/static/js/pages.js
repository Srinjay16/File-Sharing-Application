/**
 * Page Content Generation
 */

// Dashboard page
async function loadDashboard() {
    const contentDiv = document.getElementById('pageContent');
    
    try {
        // Load data
        await Promise.all([
            loadFiles(),
            loadPeers(),
            updateStats()
        ]);
        
        const recentFiles = appData.files.slice(0, 6);
        const activePeersList = Object.values(appData.activePeers);
        
        const dashboardHtml = `
            <div class="row">
                <div class="col-12">
                    <h2 class="mb-4">
                        <i class="bi bi-speedometer2"></i> Dashboard
                    </h2>
                </div>
            </div>
            
            <!-- Stats Row -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card">
                        <div class="card-body stats-widget">
                            <div class="stats-number">${appData.stats.total_files || 0}</div>
                            <div class="stats-label">Total Files</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card">
                        <div class="card-body stats-widget">
                            <div class="stats-number">${appData.stats.total_file_size_human || '0 B'}</div>
                            <div class="stats-label">Total Size</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card">
                        <div class="card-body stats-widget">
                            <div class="stats-number">${appData.stats.total_peers || 0}</div>
                            <div class="stats-label">Total Peers</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card">
                        <div class="card-body stats-widget">
                            <div class="stats-number">${appData.stats.active_peers || 0}</div>
                            <div class="stats-label">Active Peers</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <!-- Recent Files -->
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-files"></i> Recent Files
                            </h5>
                            <button class="btn btn-primary btn-sm" onclick="showPage('files')">
                                View All
                            </button>
                        </div>
                        <div class="card-body">
                            ${recentFiles.length > 0 ? `
                                <div class="file-grid">
                                    ${recentFiles.map(file => `
                                        <div class="file-item" onclick="downloadFileLocal('${file.name}')">
                                            <div class="file-icon">
                                                <i class="bi ${getFileIcon(file.extension)}"></i>
                                            </div>
                                            <div class="file-name" title="${file.name}">${file.name}</div>
                                            <div class="file-details">
                                                ${file.size_human} • ${formatDate(file.modified)}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="text-center text-muted py-4">
                                    <i class="bi bi-file-x" style="font-size: 3rem; opacity: 0.5;"></i>
                                    <p class="mt-2">No files available</p>
                                    <button class="btn btn-primary" onclick="document.querySelector('[data-bs-target=\\\"#uploadModal\\\"]').click()">
                                        <i class="bi bi-upload"></i> Upload First File
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
                
                <!-- Active Peers -->
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-people"></i> Active Peers
                            </h5>
                            <button class="btn btn-success btn-sm" onclick="showPage('peers')">
                                Manage
                            </button>
                        </div>
                        <div class="card-body">
                            ${activePeersList.length > 0 ? `
                                ${activePeersList.slice(0, 5).map(peer => `
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="peer-status ${getPeerStatusClass(peer.status)}"></div>
                                        <div class="flex-grow-1">
                                            <div class="fw-medium">${peer.name}</div>
                                            <small class="text-muted">${peer.ip}:${peer.port}</small>
                                        </div>
                                        <button class="btn btn-outline-primary btn-sm" 
                                                onclick="viewPeerFiles('${peer.ip}:${peer.port}')">
                                            <i class="bi bi-files"></i>
                                        </button>
                                    </div>
                                `).join('')}
                                ${activePeersList.length > 5 ? `
                                    <div class="text-center">
                                        <small class="text-muted">And ${activePeersList.length - 5} more...</small>
                                    </div>
                                ` : ''}
                            ` : `
                                <div class="text-center text-muted">
                                    <i class="bi bi-people" style="font-size: 2rem; opacity: 0.5;"></i>
                                    <p class="mt-2">No active peers</p>
                                    <button class="btn btn-success btn-sm" onclick="showPage('peers')">
                                        <i class="bi bi-plus-circle"></i> Add Peer
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        contentDiv.innerHTML = dashboardHtml;
        contentDiv.classList.add('fade-in');
        
    } catch (error) {
        showError(contentDiv, 'Failed to load dashboard: ' + error.message);
    }
}

// Files page
async function loadFilesPage() {
    const contentDiv = document.getElementById('pageContent');
    
    try {
        await loadFiles();
        
        const filesHtml = `
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>
                            <i class="bi bi-files"></i> My Files 
                            <span class="badge bg-secondary">${appData.files.length}</span>
                        </h2>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#uploadModal">
                            <i class="bi bi-upload"></i> Upload File
                        </button>
                    </div>
                </div>
            </div>
            
            ${appData.files.length > 0 ? `
                <div class="file-grid">
                    ${appData.files.map(file => `
                        <div class="file-item">
                            <div class="file-icon">
                                <i class="bi ${getFileIcon(file.extension)}"></i>
                            </div>
                            <div class="file-name" title="${file.name}">${file.name}</div>
                            <div class="file-details">
                                ${file.size_human} • ${formatDate(file.modified)}
                            </div>
                            <div class="mt-2">
                                <div class="btn-group w-100" role="group">
                                    <button class="btn btn-outline-primary btn-sm" 
                                            onclick="downloadFileLocal('${file.name}')"
                                            title="Download">
                                        <i class="bi bi-download"></i>
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" 
                                            onclick="deleteFile('${file.name}')"
                                            title="Delete">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="text-center py-5">
                    <i class="bi bi-file-x" style="font-size: 5rem; opacity: 0.3;"></i>
                    <h4 class="mt-3 text-muted">No Files Yet</h4>
                    <p class="text-muted">Upload your first file to start sharing!</p>
                    <button class="btn btn-primary btn-lg" data-bs-toggle="modal" data-bs-target="#uploadModal">
                        <i class="bi bi-upload"></i> Upload File
                    </button>
                </div>
            `}
        `;
        
        contentDiv.innerHTML = filesHtml;
        contentDiv.classList.add('fade-in');
        
    } catch (error) {
        showError(contentDiv, 'Failed to load files: ' + error.message);
    }
}

// Peers page
async function loadPeersPage() {
    const contentDiv = document.getElementById('pageContent');
    
    try {
        await loadPeers();
        
        const peersList = Object.entries(appData.peers);
        
        const peersHtml = `
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>
                            <i class="bi bi-people"></i> Peers 
                            <span class="badge bg-secondary">${peersList.length}</span>
                        </h2>
                        <div>
                            <button class="btn btn-outline-primary me-2" onclick="api.refreshPeers().then(() => loadPeersPage())">
                                <i class="bi bi-arrow-clockwise"></i> Refresh
                            </button>
                            <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addPeerModal">
                                <i class="bi bi-person-plus"></i> Add Peer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            ${peersList.length > 0 ? `
                <div class="row">
                    ${peersList.map(([peerId, peer]) => `
                        <div class="col-md-6 mb-3">
                            <div class="peer-item">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="peer-info">
                                        <div class="d-flex align-items-center">
                                            <div class="peer-status ${getPeerStatusClass(peer.status)}"></div>
                                            <div class="peer-name">${peer.name}</div>
                                        </div>
                                        <div class="peer-address">${peer.ip}:${peer.port}</div>
                                        <div class="peer-last-seen">
                                            Last seen: ${formatDate(peer.last_seen)} 
                                            <span class="badge status-badge ms-1 ${peer.status === 'online' ? 'bg-success' : 'bg-secondary'}">
                                                ${getPeerStatusText(peer.status)}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="btn-group-vertical" role="group">
                                        <button class="btn btn-outline-primary btn-sm" 
                                                onclick="viewPeerFiles('${peerId}')"
                                                title="View Files">
                                            <i class="bi bi-files"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" 
                                                onclick="testPeerConnection('${peerId}')"
                                                title="Test Connection">
                                            <i class="bi bi-lightning"></i>
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm" 
                                                onclick="removePeer('${peerId}')"
                                                title="Remove Peer">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="text-center py-5">
                    <i class="bi bi-people" style="font-size: 5rem; opacity: 0.3;"></i>
                    <h4 class="mt-3 text-muted">No Peers Added</h4>
                    <p class="text-muted">Add your first peer to start sharing files!</p>
                    <button class="btn btn-success btn-lg" data-bs-toggle="modal" data-bs-target="#addPeerModal">
                        <i class="bi bi-person-plus"></i> Add Peer
                    </button>
                </div>
            `}
        `;
        
        contentDiv.innerHTML = peersHtml;
        contentDiv.classList.add('fade-in');
        
    } catch (error) {
        showError(contentDiv, 'Failed to load peers: ' + error.message);
    }
}

// Transfers page
async function loadTransfersPage() {
    const contentDiv = document.getElementById('pageContent');
    
    // Get transfer history from localStorage
    const transferHistory = JSON.parse(localStorage.getItem('transferHistory') || '[]');
    
    const transfersHtml = `
        <div class="row">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>
                        <i class="bi bi-arrow-left-right"></i> Transfer Monitor
                    </h2>
                    <button class="btn btn-outline-primary" onclick="clearTransferHistory()">
                        <i class="bi bi-trash"></i> Clear History
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Active Transfers -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-activity"></i> Active Transfers
                            <span class="badge bg-success ms-2" id="activeTransferCount">0</span>
                        </h5>
                    </div>
                    <div class="card-body" id="activeTransfers">
                        <div class="text-center text-muted py-3">
                            <i class="bi bi-check-circle" style="font-size: 2rem; opacity: 0.5;"></i>
                            <p class="mt-2">No active transfers</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Transfer History -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-clock-history"></i> Transfer History
                        </h5>
                    </div>
                    <div class="card-body">
                        ${transferHistory.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-dark table-striped">
                                    <thead>
                                        <tr>
                                            <th>File</th>
                                            <th>Direction</th>
                                            <th>Peer</th>
                                            <th>Size</th>
                                            <th>Status</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${transferHistory.map(transfer => `
                                            <tr>
                                                <td>
                                                    <i class="bi ${getFileIcon(transfer.extension)} me-2"></i>
                                                    ${transfer.filename}
                                                </td>
                                                <td>
                                                    <span class="badge ${transfer.direction === 'upload' ? 'bg-primary' : 'bg-success'}">
                                                        <i class="bi ${transfer.direction === 'upload' ? 'bi-upload' : 'bi-download'}"></i>
                                                        ${transfer.direction === 'upload' ? 'Upload' : 'Download'}
                                                    </span>
                                                </td>
                                                <td>${transfer.peer || 'Local'}</td>
                                                <td>${transfer.size}</td>
                                                <td>
                                                    <span class="badge ${transfer.status === 'completed' ? 'bg-success' : transfer.status === 'failed' ? 'bg-danger' : 'bg-warning'}">
                                                        ${transfer.status}
                                                    </span>
                                                </td>
                                                <td>${formatDate(transfer.timestamp)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="text-center text-muted py-4">
                                <i class="bi bi-clock-history" style="font-size: 3rem; opacity: 0.3;"></i>
                                <h5 class="mt-3">No Transfer History</h5>
                                <p>Start uploading or downloading files to see transfer history here.</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    contentDiv.innerHTML = transfersHtml;
    contentDiv.classList.add('fade-in');
}

// Clear transfer history
function clearTransferHistory() {
    if (confirm('Are you sure you want to clear all transfer history?')) {
        localStorage.removeItem('transferHistory');
        loadTransfersPage();
        showToast('Success', 'Transfer history cleared', 'success');
    }
}

// View peer files
async function viewPeerFiles(peerId) {
    try {
        showToast('Loading', 'Fetching files from peer...', 'info');
        
        const response = await api.getPeerFiles(peerId);
        if (response.success) {
            const files = response.files;
            
            if (files.length === 0) {
                showToast('Info', 'Peer has no files to share', 'info');
                return;
            }
            
            // Create a modal to show peer files
            const modalId = 'peerFilesModal_' + Date.now();
            const modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="bi bi-files"></i> Files from ${peerId}
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="table-responsive">
                                    <table class="table table-dark table-striped">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Size</th>
                                                <th>Modified</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${files.map(file => `
                                                <tr>
                                                    <td>
                                                        <i class="bi ${getFileIcon(file.extension)} me-2"></i>
                                                        ${file.name}
                                                    </td>
                                                    <td>${file.size_human}</td>
                                                    <td>${formatDate(file.modified)}</td>
                                                    <td>
                                                        <button class="btn btn-primary btn-sm" 
                                                                onclick="downloadFromPeer('${peerId}', '${file.name}'); bootstrap.Modal.getInstance(document.getElementById('${modalId}')).hide();">
                                                            <i class="bi bi-download"></i> Download
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById(modalId));
            modal.show();
            
            // Clean up modal when hidden
            document.getElementById(modalId).addEventListener('hidden.bs.modal', () => {
                document.getElementById(modalId).remove();
            });
            
        } else {
            showToast('Error', response.message, 'error');
        }
    } catch (error) {
        showToast('Error', 'Failed to get peer files: ' + error.message, 'error');
    }
}
