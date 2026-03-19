
#!/usr/bin/env python3
"""Simple HTTP server with proper UTF-8 encoding"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import socketserver
import os
import sys

PORT = 8080

class UTF8RequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add UTF-8 charset for text files
        path = self.path
        if path.endswith('.html') or path.endswith('.js') or \
           path.endswith('.css') or path.endswith('.json'):
            ctype = self.guess_type(path)
            self.send_header('Content-Type', ctype + '; charset=utf-8')
        else:
            self.send_header('Content-Type', self.guess_type(path))
        super().end_headers()

def main():
    # Change to the script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = UTF8RequestHandler
    
    print('=' * 60)
    print('Pixel Agents Demo Server')
    print('=' * 60)
    print(f'Server running at: http://localhost:{PORT}')
    print(f'Serving from: {os.getcwd()}')
    print('=' * 60)
    print('Press Ctrl+C to stop')
    print('=' * 60)
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n' + '=' * 60)
        print('Server stopped')
        print('=' * 60)
        sys.exit(0)

if __name__ == '__main__':
    main()

