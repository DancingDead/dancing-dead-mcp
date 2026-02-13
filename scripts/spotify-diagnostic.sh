#!/bin/bash
# Spotify OAuth Diagnostic Tool

echo "🔍 Spotify MCP - Diagnostic Tool"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check .env
echo "📋 Configuration Check"
echo "----------------------"

if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    echo "  Run: cp .env.example .env"
    exit 1
fi

# Load .env
export $(cat .env | grep -v '^#' | xargs)

# Check Client ID
if [ -z "$SPOTIFY_CLIENT_ID" ]; then
    echo -e "${RED}✗ SPOTIFY_CLIENT_ID not set${NC}"
    MISSING=1
else
    echo -e "${GREEN}✓ SPOTIFY_CLIENT_ID${NC}: ${SPOTIFY_CLIENT_ID:0:8}..."
fi

# Check Client Secret
if [ -z "$SPOTIFY_CLIENT_SECRET" ]; then
    echo -e "${RED}✗ SPOTIFY_CLIENT_SECRET not set${NC}"
    MISSING=1
else
    echo -e "${GREEN}✓ SPOTIFY_CLIENT_SECRET${NC}: ${SPOTIFY_CLIENT_SECRET:0:8}..."
fi

# Check Redirect URI
if [ -z "$SPOTIFY_REDIRECT_URI" ]; then
    echo -e "${YELLOW}⚠ SPOTIFY_REDIRECT_URI not set (using default)${NC}"
    REDIRECT_URI="http://127.0.0.1:3000/spotify/callback"
else
    REDIRECT_URI="$SPOTIFY_REDIRECT_URI"
fi

echo -e "${GREEN}✓ SPOTIFY_REDIRECT_URI${NC}: $REDIRECT_URI"

echo ""

if [ ! -z "$MISSING" ]; then
    echo -e "${RED}❌ Configuration incomplete${NC}"
    echo ""
    echo "Please update your .env file with:"
    echo "  SPOTIFY_CLIENT_ID=your_client_id"
    echo "  SPOTIFY_CLIENT_SECRET=your_client_secret"
    echo ""
    exit 1
fi

# Check connected accounts
echo "👥 Connected Accounts"
echo "---------------------"

if [ -f data/spotify-accounts.json ]; then
    ACCOUNTS=$(cat data/spotify-accounts.json | grep -o '"[^"]*":' | grep -v '"display' | tr -d '":' | wc -l)
    if [ $ACCOUNTS -gt 0 ]; then
        echo -e "${GREEN}✓ $ACCOUNTS account(s) connected${NC}"
        echo ""
        cat data/spotify-accounts.json | jq -r 'to_entries[] | "  - \(.key): \(.value.displayName)"' 2>/dev/null || echo "  (unable to parse accounts)"
    else
        echo -e "${YELLOW}⚠ No accounts connected yet${NC}"
        echo "  Use: spotify-auth to connect an account"
    fi
else
    echo -e "${YELLOW}⚠ No accounts file found${NC}"
    echo "  This is normal if you haven't authenticated yet"
fi

echo ""
echo "=================================="
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Configure Spotify Application:"
echo -e "   ${BLUE}https://developer.spotify.com/dashboard${NC}"
echo ""
echo "2. Add this Redirect URI to your app:"
echo -e "   ${BLUE}$REDIRECT_URI${NC}"
echo ""
echo "3. Restart Claude Desktop"
echo ""
echo "4. Authenticate:"
echo '   Use spotify-auth to connect account "my-account"'
echo ""
echo "📖 Full guide: SPOTIFY_SETUP.md"
