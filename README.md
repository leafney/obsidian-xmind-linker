# Obsidian XMind Linker

View XMind files in Obsidian and connect to XMind software for editing.

## 🌟 Core Features

- **📖 File Viewing**: View XMind mind maps directly in Obsidian
- **🔗 Software Connection**: One-click connection to XMind software for editing
- **📄 Note Embedding**: Embed XMind files in Markdown using `![[file.xmind]]` syntax
- **⚡ Seamless Workflow**: Smooth workflow between viewing and editing
- **🖼️ Thumbnail Preview**: Auto-extract thumbnails for quick preview
- **🌐 Multi-Language**: Support for English and Simplified Chinese interface

## 📦 Installation

### Method 1: Community Plugin Store (Coming Soon)

1. Open Obsidian Settings
2. Go to Community Plugins → Browse
3. Search for "XMind Linker"
4. Install and enable the plugin

### Method 2: Manual Installation

1. Download the latest release files
2. Extract to Obsidian plugins directory: `{vault}/.obsidian/plugins/xmind-linker/`
3. Enable the plugin in Obsidian settings

### Method 3: Development Build

1. Clone the repository to plugins directory
2. Install dependencies and build

```bash
# Clone repository
git clone https://github.com/yourusername/obsidian-xmind-linker.git

# Enter directory
cd obsidian-xmind-linker

# Install dependencies (using Bun)
bun install

# Build plugin
bun run build
```

## 🚀 Usage

### 1. Direct XMind File Viewing

- Double-click `.xmind` files in Obsidian file explorer
- Or use command palette: `Ctrl+P` → "Open XMind File"

### 2. Embedding in Markdown

```markdown
# My Mind Map

Here's an embedded XMind file:

![[my-mindmap.xmind]]

Click to preview or hover for action options.
```

### 3. Thumbnail Preview

When thumbnail extraction is enabled, the plugin automatically extracts thumbnails from XMind files for direct use in Markdown:

```markdown
![[my-mindmap.xmind]]
```

### 3. Connect to XMind for Editing
- Hover over embedded files for quick actions
- Click "Open in XMind" to launch external editor
- Return to Obsidian to view after editing in XMind

## ⚙️ Settings

Configure in Obsidian Settings → Plugin Options → XMind Linker:

- **Language**: Choose interface language (English/简体中文) with automatic detection
- **System Integration**: Enable connection to XMind software
- **Hover Actions**: Display action menu on hover
- **Thumbnail Cache**: Auto-extract thumbnails for faster preview

## 🛠️ Technical Implementation

### Core Technology
- **XMind file parsing**: Native support for `.xmind` format (ZIP-based)
- **System integration**: Cross-platform XMind software invocation
- **Interactive preview**: Full preview powered by [xmind-embed-viewer](https://github.com/xmindltd/xmind-embed-viewer)
- **Smart caching**: Thumbnail extraction and caching mechanism

## 🔧 Development Guide

### Requirements

- Node.js 16+
- Bun 1.0+
- Obsidian 0.15.0+

### Development Workflow

```bash
# Install dependencies
bun install

# Development mode (watch file changes)
bun run dev

# Build production version
bun run build

# Run tests
bun test
```

### Debugging Tips

1. Enable developer tools in Obsidian: `Ctrl+Shift+I`
2. Check console output for plugin status
3. Use `console.log` for debugging

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [xmind-embed-viewer](https://github.com/xmindltd/xmind-embed-viewer) - Core preview functionality
- [Obsidian](https://obsidian.md/) - Powerful knowledge management tool
- All contributors and users for their support

## 📞 Support

If you encounter issues or have suggestions:

1. Check [Issues](https://github.com/yourusername/obsidian-xmind-linker/issues)
2. Create a new Issue
3. Join the discussion

## 📚 Documentation

- **[中文文档](README_ZH.md)** - Chinese documentation
- **[Installation Guide](docs/INSTALL.md)** - Detailed installation instructions
- **[Usage Guide](docs/USAGE_GUIDE.md)** - Comprehensive usage documentation
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Development and deployment guide

---

**Enjoy using XMind mind maps in Obsidian!** 🎉 