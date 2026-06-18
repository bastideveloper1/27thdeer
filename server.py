#!/usr/bin/env python3
import http.server
import socketserver
import os
import mimetypes

# Agregar MIME type para JavaScript modules
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('text/javascript', '.js')

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def guess_type(self, path):
        mimetype, encoding = mimetypes.guess_type(path)
        if mimetype is None:
            # Default to text/plain for unknown types
            mimetype = 'text/plain'
        return mimetype, encoding

PORT = 8000

with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
    print(f"Serving HTTP on 0.0.0.0 port {PORT} (http://localhost:{PORT}/) ...")
    httpd.serve_forever()
