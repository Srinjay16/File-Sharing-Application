/**
 * Core Application Logic
 */

// Global state
let currentPage = 'dashboard';
let appData = {
    files: [],
    peers: [],
    activePeers: [],
    stats: {}
};

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getFileIcon(extension) {
    const iconMap = {
        '.pdf': 'bi-file-pdf',
        '.doc': 'bi-file-word',
        '.docx': 'bi-file-word',
        '.xls': 'bi-file-excel',
        '.xlsx': 'bi-file-excel',
        '.ppt': 'bi-file-ppt',
        '.pptx': 'bi-file-ppt',
        '.txt': 'bi-file-text',
        '.zip': 'bi-file-zip',
        '.rar': 'bi-file-zip',
        '.jpg': 'bi-file-image',
        '.jpeg': 'bi-file-image',
        '.png': 'bi-file-image',
        '.gif': 'bi-file-image',
        '.mp3': 'bi-file-music',
        '.mp4': 'bi-file-play',
        '.avi': 'bi-file-play',
        '.mov': 'bi-file-play',
        '.mkv': 'bi-file-play',
        '.py': 'bi-file-code',
        '.js': 'bi-file-code',
        '.html': 'bi-file-code',
        '.css': 'bi-file-code'
    };
    
    return iconMap[extension.toLowerCase()] || 'bi-file-earmark';
}

function getPeerStatusClass(status) {
    const statusMap = {
        'online': 'online',
        'offline': 'offline',
        'unknown': 'unknown',
        'error': 'offline'
    };
    
    return statusMap[status] || 'unknown';
}

function getPeerStatusText(status) {
    const statusMap = {
        'online': 'Online',
        'offline': 'Offline',
        'unknown': 'Unknown',
        'error': 'Error'
    };
    
    return statusMap[status] || 'Unknown';
}

// Toast notification system
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast_' + Date.now();
    
    const iconMap = {
        'success': 'bi-check-circle',
        'error': 'bi-exclamation-circle',
        'warning': 'bi-exclamation-triangle',
        'info': 'bi-info-circle'
    };
    
    const bgMap = {
        'success': 'bg-success',
        'error': 'bg-danger',
        'warning': 'bg-warning',
        'info': 'bg-primary'
    };
    
    const toastHtml = `
        <div class="toast align-items-center text-white ${bgMap[type]}" role="alert" id="${toastId}">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="${iconMap[type]}"></i> <strong>${title}</strong><br>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Loading state management
function showLoading(element) {
    element.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="min-height: 200px;">
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="mt-2">Loading...</div>
            </div>
        </div>
    `;
}

function showError(element, message) {
    element.innerHTML = `
        <div class="alert alert-danger d-flex align-items-center" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <div>
                <strong>Error:</strong> ${message}
            </div>
        </div>
    `;
}

// Page navigation
function showPage(pageName, clickedElement = null) {
    // Update active navigation
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate the correct nav item
    if (clickedElement) {
        clickedElement.classList.add('active');
    } else {
        // Find nav item by page name
        const navItems = document.querySelectorAll('.list-group-item');
        navItems.forEach(item => {
            if (item.textContent.trim().toLowerCase().includes(pageName)) {
                item.classList.add('active');
            }
        });
    }
    
    currentPage = pageName;
    
    // Load page content
    const contentDiv = document.getElementById('pageContent');
    showLoading(contentDiv);
    
    switch (pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'files':
            loadFilesPage();
            break;
        case 'peers':
            loadPeersPage();
            break;
        case 'transfers':
            loadTransfersPage();
            break;
        default:
            showError(contentDiv, 'Page not found');
    }
}

// Update statistics
async function updateStats() {
    try {
        const response = await api.getStats();
        if (response.success) {
            appData.stats = response.stats;
            
            // Update quick stats in sidebar
            document.getElementById('statsFiles').textContent = response.stats.total_files;
            document.getElementById('statsPeers').textContent = response.stats.total_peers;
            document.getElementById('statsActive').textContent = response.stats.active_peers;
        }
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

// Refresh all data
async function refreshAll() {
    showToast('Refresh', 'Refreshing all data...', 'info');
    
    try {
        await Promise.all([
            updateStats(),
            loadFiles(),
            loadPeers(),
            api.refreshPeers()
        ]);
        
        // Reload current page
        showPage(currentPage);
        
        showToast('Success', 'All data refreshed successfully', 'success');
    } catch (error) {
        showToast('Error', 'Failed to refresh data: ' + error.message, 'error');
    }
}

// Data loading functions
async function loadFiles() {
    try {
        const response = await api.getFiles();
        if (response.success) {
            appData.files = response.files;
        }
    } catch (error) {
        console.error('Failed to load files:', error);
        throw error;
    }
}

async function loadPeers() {
    try {
        const response = await api.getPeers();
        if (response.success) {
            appData.peers = response.peers;
            appData.activePeers = response.active_peers;
        }
    } catch (error) {
        console.error('Failed to load peers:', error);
        throw error;
    }
}

// File operations
async function deleteFile(filename) {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
        return;
    }
    
    try {
        const response = await api.deleteFile(filename);
        if (response.success) {
            showToast('Success', response.message, 'success');
            loadFilesPage(); // Reload files page
            updateStats(); // Update stats
        } else {
            showToast('Error', response.message, 'error');
        }
    } catch (error) {
        showToast('Error', 'Failed to delete file: ' + error.message, 'error');
    }
}

async function downloadFileLocal(filename) {
    try {
        await api.downloadFile(filename);
        showToast('Download', `Downloading "${filename}"...`, 'info');
    } catch (error) {
        showToast('Error', 'Failed to download file: ' + error.message, 'error');
    }
}

// Peer operations
async function removePeer(peerId) {
    if (!confirm(`Are you sure you want to remove peer "${peerId}"?`)) {
        return;
    }
    
    try {
        const response = await api.removePeer(peerId);
        if (response.success) {
            showToast('Success', response.message, 'success');
            loadPeersPage(); // Reload peers page
            updateStats(); // Update stats
        } else {
            showToast('Error', response.message, 'error');
        }
    } catch (error) {
        showToast('Error', 'Failed to remove peer: ' + error.message, 'error');
    }
}

async function testPeerConnection(peerId) {
    try {
        const response = await api.testPeer(peerId);
        if (response.success) {
            showToast('Test', response.message, 'info');
            
            // Reload peers after a short delay to see updated status
            setTimeout(() => {
                loadPeersPage();
            }, 2000);
        } else {
            showToast('Error', response.message, 'error');
        }
    } catch (error) {
        showToast('Error', 'Failed to test peer: ' + error.message, 'error');
    }
}

async function downloadFromPeer(peerId, filename) {
    try {
        showToast('Download', `Starting download of "${filename}" from peer...`, 'info');
        
        // Add to transfer history
        addToTransferHistory(filename, 'download', peerId, 'Unknown', 'in_progress');
        
        const response = await api.downloadFromPeer(peerId, filename);
        if (response.success) {
            showToast('Success', response.message, 'success');
            
            // Update transfer history
            addToTransferHistory(filename, 'download', peerId, 'Unknown', 'completed');
            
            // Reload files page to show the new file
            setTimeout(() => {
                if (currentPage === 'files') {
                    loadFilesPage();
                }
                updateStats();
            }, 1000);
        } else {
            showToast('Error', response.message, 'error');
            addToTransferHistory(filename, 'download', peerId, 'Unknown', 'failed');
        }
    } catch (error) {
        showToast('Error', 'Failed to download from peer: ' + error.message, 'error');
        addToTransferHistory(filename, 'download', peerId, 'Unknown', 'failed');
    }
}

// Add transfer to history function
function addToTransferHistory(filename, direction, peer, size, status) {
    const history = JSON.parse(localStorage.getItem('transferHistory') || '[]');
    const transfer = {
        filename,
        extension: '.' + filename.split('.').pop(),
        direction,
        peer,
        size,
        status,
        timestamp: new Date().toISOString()
    };
    
    history.unshift(transfer); // Add to beginning
    if (history.length > 50) history.pop(); // Keep only last 50
    
    localStorage.setItem('transferHistory', JSON.stringify(history));
}

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
