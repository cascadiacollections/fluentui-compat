# Cursor MCP Configuration

This directory contains configuration for the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) integration with AI coding assistants.

## Files

- **mcp.json**: Configuration for MCP servers used by Cursor and other compatible AI coding assistants

## Rush MCP Server

This repository uses the [RushStack MCP server](https://rushjs.io/pages/ai/rush_mcp/) to provide AI coding assistants with enhanced understanding of the Rush monorepo structure, project dependencies, and build system.

### Features

- Repository structure navigation
- Project dependency information
- Rush command knowledge
- Build configuration context

### Installation

The MCP server is automatically installed via Rush's autoinstaller system. No manual installation is required.

### Usage

When using Cursor or other MCP-compatible AI coding assistants, they will automatically detect and use this configuration to provide enhanced assistance specific to this Rush monorepo.

### Updating

To update the MCP server to the latest version:

```bash
# Update the version in common/autoinstallers/rush-mcp-server/package.json
# Then run:
rush update-autoinstaller --name rush-mcp-server
```

## More Information

- [RushStack MCP Server Documentation](https://rushjs.io/pages/ai/rush_mcp/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cursor AI Documentation](https://cursor.sh/docs)
