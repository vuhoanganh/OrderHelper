#!/bin/bash
# OrderHelper Local Development Server

PORT=8000
echo "🚀 Starting OrderHelper on http://localhost:$PORT"
echo ""
echo "📝 Press Ctrl+C to stop"
echo ""

# Try Python 3 first (most common)
if command -v python3 &> /dev/null; then
    echo "✅ Using Python 3"
    python3 -m http.server $PORT
# Try Python 2
elif command -v python &> /dev/null; then
    echo "✅ Using Python 2"
    python -m SimpleHTTPServer $PORT
# Try Node.js http-server
elif command -v http-server &> /dev/null; then
    echo "✅ Using http-server (Node.js)"
    http-server -p $PORT
else
    echo "❌ Error: No HTTP server found!"
    echo ""
    echo "Please install one of:"
    echo "  - Python 3: https://www.python.org/"
    echo "  - Node.js http-server: npm install -g http-server"
    exit 1
fi
