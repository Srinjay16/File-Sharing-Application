# Overview

This is a peer-to-peer (P2P) file sharing application that allows users to share files directly between devices using a Flask-based backend API and a web-based frontend. The application features a separated architecture with independent backend and frontend components that can run separately or together, providing file upload/download capabilities and peer network management.

# System Architecture

## Frontend Architecture
- **Static Web Interface**: HTML/CSS/JavaScript frontend served by Python's built-in HTTP server on port 3000
- **Bootstrap Framework**: Responsive dark-themed UI with Bootstrap 5 and Bootstrap Icons
- **Modular JavaScript**: Organized into separate modules for API client, application logic, page rendering, and modal management
- **Single Page Application**: Dynamic content loading with client-side navigation between dashboard, files, peers, and transfers pages

## Backend Architecture
- **Flask API Server**: RESTful API server running on port 5000 with CORS enabled for cross-origin requests
- **Dual Server Design**: Separate HTTP API server for web interface and TCP server on port 8000 for direct file transfers
- **Threading Model**: Multi-threaded architecture using daemon threads for concurrent TCP file server operations
- **Modular Components**: Separated into distinct modules for API routes, file management, peer discovery, and TCP server functionality

## Data Storage
- **File System Storage**: Local file storage using a configurable `shared_files` directory with file metadata extraction
- **In-Memory State**: Peer information, file metadata, and active transfer tracking stored in memory without persistent database
- **Configuration Management**: Environment-based configuration with sensible defaults for ports, file size limits, and supported file types

## Transfer Protocol
- **Custom TCP Protocol**: Direct peer-to-peer file transfers using custom TCP protocol with 8KB chunk sizes
- **File Validation**: Support for multiple file formats with extension filtering and 100MB size limits
- **Connection Management**: Peer connection testing and status monitoring with timeout handling

## Application Structure
- **Separated Architecture**: Independent frontend and backend that can run separately or together using multiple start scripts
- **Legacy Compatibility**: Backward compatibility maintained through legacy main.py entry point
- **Process Management**: Coordinated startup and shutdown of both servers with signal handling

# External Dependencies

## Python Packages
- **Flask**: Core web framework for HTTP API server and routing functionality
- **Flask-CORS**: Cross-Origin Resource Sharing support for frontend-backend communication
- **Flask-SQLAlchemy**: SQL database toolkit (available but not actively used in current file-based implementation)
- **Werkzeug**: WSGI utilities for secure file upload handling and HTTP utilities
- **Gunicorn**: WSGI HTTP server for production deployment scenarios

## Frontend Libraries
- **Bootstrap 5**: CSS framework for responsive UI components with dark theme support
- **Bootstrap Icons**: Icon library for consistent visual elements throughout the interface
- **Native JavaScript**: Pure JavaScript implementation without additional frontend frameworks

## System Dependencies
- **Python Standard Library**: Threading, socket, os, hashlib, mimetypes, and logging modules for core functionality
- **HTTP Server**: Python's built-in http.server module for serving static frontend files
