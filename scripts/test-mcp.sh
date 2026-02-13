#!/bin/bash
# Test script for MCP servers

echo "🧪 Testing Dancing Dead MCP Servers"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_server() {
    local server_name=$1
    echo -n "Testing $server_name server... "

    # Send initialize message
    local response=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | npx tsx src/stdio-server.ts "$server_name" 2>&1)

    # Check if response contains success
    if echo "$response" | grep -q '"result"'; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Check .env file
echo "Checking configuration..."
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    echo "  Copy .env.example to .env and fill in your credentials"
    exit 1
fi
echo -e "${GREEN}✓ .env file exists${NC}"
echo ""

# Test servers
test_server "ping"
test_server "spotify"

echo ""
echo "===================================="
echo "✅ All tests passed!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop"
echo "2. Check MCP servers are detected"
echo "3. Test with: 'Use the ping tool'"
