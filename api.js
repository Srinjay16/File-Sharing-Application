/**
 * API Client for P2P File Sharing Backend
 */

class APIClient {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Handle non-JSON responses (like file downloads)
            if (options.responseType === 'blob') {
                return response.blob();
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Health and info endpoints
    async getApiInfo() {
        return this.request('/');
    }

    async getHealth() {
        return this.request('/api/health');
    }

    // File endpoints
    async getFiles() {
        return this.request('/api/files');
    }

    async uploadFile(file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const xhr = new XMLHttpRequest();
            
            return new Promise((resolve, reject) => {
                xhr.upload.addEventListener('progress', (e) => {
                    if (onProgress && e.lengthComputable) {
                        const progress = (e.loaded / e.total) * 100;
                        onProgress(progress);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed'));
                });

                xhr.open('POST', `${this.baseUrl}/api/files/upload`);
                xhr.send(formData);
            });
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    }

    async downloadFile(filename) {
        const url = `${this.baseUrl}/api/files/download/${encodeURIComponent(filename)}`;
        window.open(url, '_blank');
    }

    async deleteFile(filename) {
        return this.request(`/api/files/delete/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });
    }

    // Peer endpoints
    async getPeers() {
        return this.request('/api/peers');
    }

    async addPeer(peerData) {
        return this.request('/api/peers/add', {
            method: 'POST',
            body: JSON.stringify(peerData)
        });
    }

    async removePeer(peerId) {
        return this.request(`/api/peers/remove/${encodeURIComponent(peerId)}`, {
            method: 'DELETE'
        });
    }

    async testPeer(peerId) {
        return this.request(`/api/peers/test/${encodeURIComponent(peerId)}`, {
            method: 'POST'
        });
    }

    async getPeerFiles(peerId) {
        return this.request(`/api/peers/${encodeURIComponent(peerId)}/files`);
    }

    async downloadFromPeer(peerId, filename) {
        return this.request('/api/peers/download', {
            method: 'POST',
            body: JSON.stringify({
                peer_id: peerId,
                filename: filename
            })
        });
    }

    async refreshPeers() {
        return this.request('/api/peers/refresh', {
            method: 'POST'
        });
    }

    // Stats endpoint
    async getStats() {
        return this.request('/api/stats');
    }
}

// Create global API client instance
const api = new APIClient();

// Export for use in other modules
window.api = api;
