/**
 * Modal Management and Form Handling
 */

// File Upload Modal
async function uploadFile() {
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = progressDiv.querySelector('.progress-bar');
    
    if (!fileInput.files.length) {
        showToast('Error', 'Please select a file to upload', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Show progress bar
    progressDiv.style.display = 'block';
    progressBar.style.width = '0%';
    
    try {
        const response = await api.uploadFile(file, (progress) => {
            progressBar.style.width = progress + '%';
            progressBar.textContent = Math.round(progress) + '%';
        });
        
        if (response.success) {
            showToast('Success', response.message, 'success');
            
            // Add to transfer history
            addToTransferHistory(file.name, 'upload', 'Local', formatFileSize(file.size), 'completed');
            
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
            modal.hide();
            
            // Reset form
            form.reset();
            progressDiv.style.display = 'none';
            progressBar.style.width = '0%';
            progressBar.textContent = '';
            
            // Hide preview
            document.getElementById('uploadPreview').style.display = 'none';
            
            // Refresh current page if it's files page
            if (currentPage === 'files') {
                loadFilesPage();
            }
            
            // Update stats
            updateStats();
            
        } else {
            showToast('Error', response.message, 'error');
        }
        
    } catch (error) {
        showToast('Error', 'Upload failed: ' + error.message, 'error');
    } finally {
        // Hide progress bar after a short delay
        setTimeout(() => {
            progressDiv.style.display = 'none';
            progressBar.style.width = '0%';
            progressBar.textContent = '';
        }, 1000);
    }
}

// Add Peer Modal
async function addPeer() {
    const form = document.getElementById('addPeerForm');
    const formData = new FormData(form);
    
    const peerData = {
        ip: formData.get('ip').trim(),
        port: parseInt(formData.get('port')),
        name: formData.get('name').trim() || undefined
    };
    
    // Validate input
    if (!peerData.ip) {
        showToast('Error', 'IP address is required', 'error');
        return;
    }
    
    if (!peerData.port || peerData.port < 1 || peerData.port > 65535) {
        showToast('Error', 'Please enter a valid port number (1-65535)', 'error');
        return;
    }
    
    // Basic IP validation
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(peerData.ip)) {
        showToast('Error', 'Please enter a valid IP address', 'error');
        return;
    }
    
    try {
        const response = await api.addPeer(peerData);
        
        if (response.success) {
            showToast('Success', response.message, 'success');
            
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addPeerModal'));
            modal.hide();
            
            // Reset form
            form.reset();
            
            // Refresh peers page if current
            if (currentPage === 'peers') {
                loadPeersPage();
            }
            
            // Update stats
            updateStats();
            
        } else {
            showToast('Error', response.message, 'error');
        }
        
    } catch (error) {
        showToast('Error', 'Failed to add peer: ' + error.message, 'error');
    }
}

// Drag and Drop functionality for file upload
function initializeDragAndDrop() {
    const uploadModal = document.getElementById('uploadModal');
    const fileInput = document.getElementById('fileInput');
    
    // Create drop zone
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone mt-3';
    dropZone.innerHTML = `
        <div class="drop-zone-icon">
            <i class="bi bi-cloud-upload"></i>
        </div>
        <div>
            <strong>Drop files here</strong> or click to browse
        </div>
        <div class="text-muted">Maximum file size: 100MB</div>
    `;
    
    // Insert drop zone after file input
    fileInput.parentNode.insertBefore(dropZone, fileInput.nextSibling);
    
    // Handle drop zone click
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropZone.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropZone.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            
            // Show file name
            const fileName = files[0].name;
            dropZone.innerHTML = `
                <div class="drop-zone-icon">
                    <i class="bi bi-file-earmark-check text-success"></i>
                </div>
                <div>
                    <strong>${fileName}</strong> selected
                </div>
                <div class="text-muted">Click upload to continue</div>
            `;
        }
    }
}

// File input change handler
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            const fileName = file.name;
            const fileSize = formatFileSize(file.size);
            const fileType = file.type;
            
            // Update drop zone if it exists
            const dropZone = document.querySelector('.drop-zone');
            if (dropZone) {
                dropZone.innerHTML = `
                    <div class="drop-zone-icon">
                        <i class="bi bi-file-earmark-check text-success"></i>
                    </div>
                    <div>
                        <strong>${fileName}</strong> (${fileSize})
                    </div>
                    <div class="text-muted">Click upload to continue</div>
                `;
            }
            
            // Show file preview
            showFilePreview(file);
        }
    });
    
    // File preview function
    function showFilePreview(file) {
        const previewDiv = document.getElementById('uploadPreview');
        const previewContent = document.getElementById('previewContent');
        
        if (file.type.startsWith('image/') && file.size < 5 * 1024 * 1024) { // 5MB limit for preview
            const reader = new FileReader();
            reader.onload = function(e) {
                previewContent.innerHTML = `
                    <img src="${e.target.result}" class="img-fluid rounded" style="max-height: 200px;">
                    <p class="mt-2 mb-0"><strong>${file.name}</strong> (${formatFileSize(file.size)})</p>
                `;
                previewDiv.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('text/') && file.size < 1 * 1024 * 1024) { // 1MB limit for text preview
            const reader = new FileReader();
            reader.onload = function(e) {
                const text = e.target.result.substring(0, 500); // First 500 characters
                previewContent.innerHTML = `
                    <pre class="bg-dark p-2 rounded" style="max-height: 150px; overflow-y: auto; font-size: 0.8rem;">${text}${e.target.result.length > 500 ? '...' : ''}</pre>
                    <p class="mt-2 mb-0"><strong>${file.name}</strong> (${formatFileSize(file.size)})</p>
                `;
                previewDiv.style.display = 'block';
            };
            reader.readAsText(file);
        } else {
            // Show file info for other types
            previewContent.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bi ${getFileIcon('.' + file.name.split('.').pop())} me-3" style="font-size: 2rem;"></i>
                    <div>
                        <strong>${file.name}</strong><br>
                        <span class="text-muted">${formatFileSize(file.size)} • ${file.type || 'Unknown type'}</span>
                    </div>
                </div>
            `;
            previewDiv.style.display = 'block';
        }
    }
    
    // Initialize drag and drop after modal is shown
    const uploadModal = document.getElementById('uploadModal');
    uploadModal.addEventListener('shown.bs.modal', function() {
        setTimeout(initializeDragAndDrop, 100);
    });
    
    // Reset drop zone when modal is hidden
    uploadModal.addEventListener('hidden.bs.modal', function() {
        const dropZone = document.querySelector('.drop-zone');
        if (dropZone) {
            dropZone.innerHTML = `
                <div class="drop-zone-icon">
                    <i class="bi bi-cloud-upload"></i>
                </div>
                <div>
                    <strong>Drop files here</strong> or click to browse
                </div>
                <div class="text-muted">Maximum file size: 100MB</div>
            `;
            dropZone.classList.remove('drag-over');
        }
    });
});

// Form validation and enhancement
document.addEventListener('DOMContentLoaded', function() {
    // Add form validation styles
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
    
    // Add Enter key handlers for modals
    document.getElementById('uploadModal').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            uploadFile();
        }
    });
    
    document.getElementById('addPeerModal').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addPeer();
        }
    });
    
    // Auto-focus first input when modals are shown
    document.getElementById('uploadModal').addEventListener('shown.bs.modal', function() {
        document.getElementById('fileInput').focus();
    });
    
    document.getElementById('addPeerModal').addEventListener('shown.bs.modal', function() {
        document.getElementById('peerIp').focus();
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+U or Cmd+U for upload
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        const uploadBtn = document.querySelector('[data-bs-target="#uploadModal"]');
        if (uploadBtn) {
            uploadBtn.click();
        }
    }
    
    // Ctrl+P or Cmd+P for add peer
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        const addPeerBtn = document.querySelector('[data-bs-target="#addPeerModal"]');
        if (addPeerBtn) {
            addPeerBtn.click();
        }
    }
    
    // Ctrl+R or Cmd+R for refresh (prevent default and use our refresh)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshAll();
    }
});
