<div align="center">
  <img src="https://assets.nonefivem.com/logo/dark-square.png" alt="NoneM Logo" width="128" height="128">

# no-file-server

**A lightweight local file upload server for FiveM**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![FiveM](https://img.shields.io/badge/FiveM-F40552?style=for-the-badge&logo=fivem&logoColor=white)](https://fivem.net/)

</div>

---

## About

**no-file-server** is a simple HTTP file upload server designed for FiveM. It allows your server-side scripts to upload, store, and serve files (images, audio, video, PDFs) locally without relying on external services.

Runs on FiveM's Node.js runtime via `@citizenfx/http-wrapper`.

## Features

- 📁 **File Uploads** - Upload images, audio, video, and documents
- 🔗 **File Serving** - Access uploaded files via HTTP
- ⚙️ **Configurable** - Max file size, allowed mime types, directories
- **Lightweight** - Minimal dependencies, fast builds

## Installation

1. Download the latest release from [Releases](../../releases)
2. Extract to your FiveM resources folder
3. Add `ensure no-file-server` to your `server.cfg`
4. Configure `config.json` as needed

## Configuration

Edit `config.json` to customize:

| Option                     | Description         | Default                   |
| -------------------------- | ------------------- | ------------------------- |
| `uploads.directory`        | Upload folder path  | `./uploads`               |
| `uploads.maxFileSizeMB`    | Max file size in MB | `10`                      |
| `uploads.allowedMimeTypes` | Allowed file types  | Images, audio, video, PDF |

## API Endpoints

| Method | Endpoint             | Description                                   |
| ------ | -------------------- | --------------------------------------------- |
| `POST` | `/uploads`           | Upload a file (multipart form, field: `file`) |
| `GET`  | `/uploads/:filename` | Get/serve a file                              |

## Development

```bash
# Install dependencies
bun install

# Build for production (minified)
bun run build

# Build for development (with sourcemaps)
bun run build:dev
```

## License

MIT
