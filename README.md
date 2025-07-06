# Obsidian XMind Linker

A powerful Obsidian plugin that enables viewing and embedding XMind mind map files directly within Obsidian.

## 🌟 Features

- **📁 File Support**: Open and view `.xmind` files directly in Obsidian
- **🖼️ Embed Preview**: Embed XMind files in Markdown using `![[file.xmind]]` syntax
- **🔍 Thumbnail Extraction**: Automatically extract thumbnails from XMind files for quick preview
- **🖱️ Interactive Preview**: Full interactive preview powered by [xmind-embed-viewer](https://github.com/xmindltd/xmind-embed-viewer)
- **⚡ Hover Actions**: Quick action menu on hover
- **🔗 System Integration**: One-click opening with system default XMind application
- **🌍 Multi-Region Support**: Support for global and China mainland CDN acceleration
- **⚙️ Customizable Settings**: Rich configuration options for different needs

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

### 4. Quick Commands

- **Extract Thumbnail**: `Ctrl+P` → "Extract XMind Thumbnail"
- **Clear Cache**: `Ctrl+P` → "Clear Thumbnail Cache"
- **System Open**: Click "Open in XMind" in preview interface

## ⚙️ Settings

Configure in Obsidian Settings → Plugin Options → XMind Linker:

- **Enable Thumbnail Extraction**: Automatically extract and cache XMind file thumbnails
- **Default Region**: Choose CDN region (Global/China Mainland)
- **Show Hover Tooltip**: Display action menu on hover
- **Enable System Integration**: Allow calling system XMind application
- **Thumbnail Cache Directory**: Set cache directory name

## 🛠️ Technical Implementation

### Core Tech Stack

- **TypeScript**: Primary development language
- **xmind-embed-viewer**: Core XMind file preview library
- **JSZip**: For parsing XMind files (ZIP format)
- **Obsidian API**: Deep integration with Obsidian functionality

### Architecture Design

```
obsidian-xmind-linker/
├── src/
│   ├── core/           # Core logic
│   ├── file-handler/   # File processing
│   ├── viewer/         # Preview components
│   ├── ui/             # User interface
│   └── types/          # Type definitions
├── main.ts             # Plugin entry point
└── styles.css          # Style file
```

### Key Features

1. **ZIP File Parsing**: XMind files are essentially ZIP packages containing XML data and thumbnails
2. **Dynamic Loading**: On-demand loading of xmind-embed-viewer library
3. **Caching Mechanism**: Smart thumbnail caching to avoid repeated extraction
4. **Event-Driven**: Responsive design based on Obsidian event system

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

- **[中文文档](docs/README_zh.md)** - Chinese documentation
- **[Installation Guide](docs/INSTALL.md)** - Detailed installation instructions
- **[Usage Guide](docs/USAGE_GUIDE.md)** - Comprehensive usage documentation
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Development and deployment guide

---

**Enjoy using XMind mind maps in Obsidian!** 🎉 