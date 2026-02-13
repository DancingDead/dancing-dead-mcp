#!/bin/bash
# Cleanup script - Kill processes using MCP ports

echo "🧹 Cleaning up MCP server ports..."
echo "=================================="
echo ""

# Check port 3000
PORT_3000=$(lsof -ti :3000)
if [ ! -z "$PORT_3000" ]; then
    echo "Found process on port 3000 (PID: $PORT_3000)"
    kill -9 $PORT_3000
    echo "✅ Port 3000 freed"
else
    echo "✅ Port 3000 already free"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop"
echo "2. Try: Use spotify-auth to connect account \"dancing-dead\""
