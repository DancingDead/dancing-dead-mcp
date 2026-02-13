# 🎸 Dancing Dead Records - MCP Server Infrastructure

Centralized Model Context Protocol (MCP) server infrastructure for Dancing Dead Records, providing Spotify integration and multi-account management for Claude Desktop.

## 🚀 Quick Start

**Got an error?** → See the troubleshooting guides:
- **"INVALID_CLIENT"** → [RESOLUTION_INVALID_CLIENT.md](./RESOLUTION_INVALID_CLIENT.md)
- **"invalid_grant"** → [TROUBLESHOOT_INVALID_GRANT.md](./TROUBLESHOOT_INVALID_GRANT.md)
- **"403 User not registered"** → [SPOTIFY_403_FIX.md](./SPOTIFY_403_FIX.md)
- **"403 Forbidden" / Premium required** → [SPOTIFY_FREE_LIMITATIONS.md](./SPOTIFY_FREE_LIMITATIONS.md)
- **Port 3000 occupied** → [PROBLEM_SOLVED.md](./PROBLEM_SOLVED.md)

### 1. Install

```bash
npm install
cp .env.example .env
# Edit .env with your Spotify credentials
```

### 2. Configure Spotify

Add this redirect URI to your [Spotify Dashboard](https://developer.spotify.com/dashboard):
```
http://127.0.0.1:3000/spotify/callback
```

Full instructions: [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md)

### 3. Test

```bash
./scripts/spotify-diagnostic.sh
./scripts/test-mcp.sh
```

### 4. Use with Claude Desktop

Configuration is already set at:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Restart Claude Desktop, then:
```
Use spotify-auth to connect account "my-account"
```

Full setup: [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md)

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Solve "INVALID_CLIENT" error
- **[SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md)** - Spotify OAuth configuration
- **[CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md)** - Claude Desktop integration

## 🎯 Features

### Spotify MCP Server (33 tools)

- **Account Management**: Multi-account support, OAuth flow
- **Search**: Tracks, albums, artists, playlists
- **Playlists**: Create, update, reorder, manage tracks
- **Playback**: Control playback, queue, volume, devices
- **Library**: Save/remove tracks, liked songs
- **Insights**: Top tracks/artists, recently played

### Infrastructure

- **Multi-account**: Manage multiple Spotify accounts simultaneously
- **Auto-refresh**: Automatic token refresh
- **Dual-mode**: Stdio (Claude Desktop) + HTTP/SSE (programmatic)
- **Temporary OAuth**: Automatic OAuth server for stdio mode

## 🏗️ Architecture

```
dancing-dead-mcp/
├── src/
│   ├── server.ts              # HTTP/SSE server (optional)
│   ├── stdio-server.ts        # Stdio server for Claude Desktop
│   ├── servers/
│   │   └── spotify/
│   │       ├── index.ts       # Spotify server factory
│   │       ├── tools.ts       # 33 MCP tools
│   │       ├── auth.ts        # OAuth flow
│   │       ├── oauth-server.ts # Temporary OAuth server
│   │       ├── api.ts         # Spotify API client
│   │       └── store.ts       # Token storage
│   └── config.ts              # Configuration
├── data/
│   └── spotify-accounts.json  # Encrypted tokens (auto-generated)
└── scripts/
    ├── spotify-diagnostic.sh  # Configuration checker
    └── test-mcp.sh           # Server tester
```

## 🛠️ Development

### Run HTTP Server (optional)

```bash
npm run dev
```

Endpoints:
- `http://localhost:3000/health` - Health check
- `http://localhost:3000/api/mcp/list` - List MCP servers
- `http://localhost:3000/spotify/sse` - Spotify SSE endpoint
- `http://localhost:3000/ping/sse` - Ping SSE endpoint

### Run Stdio Server (for testing)

```bash
npx tsx src/stdio-server.ts spotify
npx tsx src/stdio-server.ts ping
```

### Build

```bash
npm run build
```

## 📦 Available MCP Servers

### 🎵 Spotify
Full Spotify Web API integration with multi-account support.

**Tools**: `spotify-auth`, `spotify-accounts`, `spotify-search`, `spotify-create-playlist`, `spotify-play`, `spotify-pause`, `spotify-now-playing`, and 26 more...

### 🏓 Ping
Simple connectivity test server.

**Tools**: `ping`, `server-info`

## 🔐 Security

- Tokens are stored in `data/spotify-accounts.json`
- Auto-refresh handles expired tokens
- OAuth uses PKCE flow (when available)
- Client secrets are never exposed to the client

## 🐛 Troubleshooting

### "INVALID_CLIENT: Invalid redirect URI"
→ See [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md) - You need to add the redirect URI to your Spotify app.

### "Server disconnected"
```bash
./scripts/spotify-diagnostic.sh  # Check configuration
./scripts/test-mcp.sh           # Test servers
```

### Check logs
- Claude Desktop: View → Developer Tools → Console
- Manual test: `npx tsx src/stdio-server.ts spotify`

## 🎤 Adding New MCP Servers

1. Create server in `src/servers/your-server/`
2. Add case to `src/stdio-server.ts`
3. Register in `src/server.ts` (for HTTP mode)
4. Update Claude Desktop config
5. Restart Claude Desktop

## 📝 License

Private - Dancing Dead Records

## 🤝 Contributing

This is a private infrastructure project for Dancing Dead Records.

---

Made with ❤️ for [Dancing Dead Records](https://dancingdead.world)
