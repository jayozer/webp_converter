# Media Optimizer

[![Try Live Demo](https://img.shields.io/badge/Try%20Live%20Demo-Visit%20App-blue?style=for-the-badge&logo=vercel)](https://popmedia.vercel.app)

**Optimize images and compress videos directly in your browser - no uploads, complete privacy.**

A modern Next.js application for converting images to WebP format and compressing videos using browser-based FFmpeg. Built with privacy-first architecture where video processing happens entirely in your browser.

---

## ✨ Why This App is Different

### 🔒 **Privacy-First Video Compression**
Your videos **never leave your computer**. Using WebAssembly-powered FFmpeg, all video compression happens directly in your browser. No server uploads, no cloud processing, complete privacy.

### ⚡ **Modern Web Technologies**
- **FFmpeg.wasm**: Full-featured video processing running as WebAssembly in your browser
- **Sharp**: Lightning-fast server-side image optimization
- **Next.js 15 + React 19**: Latest web framework with advanced performance optimizations

### 🎯 **Professional Results**
- Reduce video file sizes by 50-90% while maintaining quality
- Convert images to WebP with up to 80% size reduction
- Batch processing for multiple files simultaneously

---

## 🚀 Features

### 🎬 Video Compressor (Browser-Based)
**Powered by FFmpeg.wasm - 100% client-side processing**

- **Complete Privacy**: Videos never uploaded to servers - all processing happens in your browser
- **Multiple Input Formats**: MP4, MOV, AVI, WebM, MKV
- **Multiple Output Formats**: MP4, WebM, MOV
- **6 Quality Presets**: From Ultra Low (300kbps) to Ultra (10000kbps)
- **Custom Bitrate Control**: Fine-tune compression with slider (300-10000kbps)
- **Advanced Options**:
  - Maintain resolution or auto-downscale to 720p
  - Remove audio track for smaller files
  - Real-time compression progress tracking
- **Batch Processing**: Compress multiple videos simultaneously
- **No Size Limits**: Process large videos without server timeouts

### 🖼️ Image Converter (Server-Optimized)
**Powered by Sharp - High-performance image processing**

- **WebP Conversion**: Convert PNG, JPG, JPEG, GIF, BMP, TIFF to WebP
- **Quality Control**: Adjustable quality slider (1-100)
- **Lossless Mode**: Zero quality loss compression
- **Batch Processing**: Convert multiple images at once
- **Advanced Options**:
  - Preserve or strip metadata (EXIF, location data)
  - Maintain transparency (PNG/GIF alpha channels)
  - Auto-resize large images (>2048px) for web optimization
- **Smart Compression**: Up to 80% size reduction

---

## 🏗️ Architecture

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│  VIDEO COMPRESSION (Client-Side)                        │
│                                                          │
│  Your Browser                                            │
│  ┌────────────────────────────────────────────┐         │
│  │ 1. Select video file                       │         │
│  │ 2. FFmpeg.wasm loads (WebAssembly)         │         │
│  │ 3. Processing happens in browser memory    │         │
│  │ 4. Download compressed video               │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ✅ Video never leaves your computer                    │
│  ✅ No server uploads or cloud processing               │
│  ✅ Works offline after initial page load               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  IMAGE CONVERSION (Server-Side)                         │
│                                                          │
│  Your Browser          →        Next.js Server          │
│  ┌──────────────┐              ┌──────────────┐         │
│  │ Upload image │  ───────→    │ Sharp library│         │
│  │              │              │ processes &  │         │
│  │ Download     │  ←───────    │ optimizes    │         │
│  │ WebP image   │              │ to WebP      │         │
│  └──────────────┘              └──────────────┘         │
│                                                          │
│  📤 Images sent to server for processing                │
│  📥 Optimized WebP images returned                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend Framework
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

### UI & Styling
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)
![Radix UI](https://img.shields.io/badge/Radix_UI-Primitives-black)

### Processing Engines
- **FFmpeg.wasm** (v0.12.15): Browser-based video compression via WebAssembly
- **Sharp** (v0.34.2): High-performance server-side image processing

### Key Dependencies
- `@ffmpeg/ffmpeg`: WebAssembly FFmpeg for in-browser video processing
- `sharp`: Fast Node.js image processing library
- `@radix-ui/*`: Accessible component primitives
- `lucide-react`: Modern icon library

---

## 📦 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**

**Note**: No FFmpeg installation required! Video compression uses FFmpeg.wasm which runs in the browser.

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/jayozer/webp_converter.git
cd webp_converter/webp_converter
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

4. **Open your browser**
```
http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import repository on [Vercel](https://vercel.com)
3. Deploy with default settings

**✅ Video compression works perfectly on Vercel** (and any hosting platform) because it runs client-side in the browser, not on the server.

### Environment Requirements

**For Video Compression**:
- Modern browser with SharedArrayBuffer support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- COOP/COEP headers enabled (configured in `next.config.ts`)

**For Image Conversion**:
- Node.js runtime with Sharp support
- Sufficient memory for image processing

### Docker (Optional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**Note**: No need to install FFmpeg in Docker - video processing is browser-based!

---

## 🔌 API Routes

### `/api/convert` - Image to WebP Conversion

**Method**: POST
**Content-Type**: multipart/form-data

**Request Body** (FormData):
```javascript
{
  files: File[],              // Image files to convert
  quality: string,            // 1-100 (default: 80)
  lossless: string,           // "true" | "false"
  preserveMetadata: string,   // "true" | "false"
  preserveTransparency: string, // "true" | "false"
  autoResize: string          // "true" | "false"
}
```

**Response**:
```javascript
{
  results: [
    {
      webpData: string,    // Base64 encoded WebP image
      webpSize: number     // File size in bytes
    }
  ]
}
```

---

## 🔒 Privacy & Security

### Video Processing
- **100% Browser-Based**: Videos processed entirely in your browser using FFmpeg.wasm
- **Zero Server Upload**: Your videos never leave your device
- **Offline-Capable**: After initial page load, can work without internet
- **No Tracking**: No analytics on video processing

### Image Processing
- **Temporary Server Storage**: Images sent to Next.js API route for processing
- **Immediate Deletion**: Files deleted from server after conversion
- **No Persistence**: Images not stored or logged
- **Secure Transfer**: HTTPS encryption for all uploads

---

## 🌍 Browser Support

| Browser | Minimum Version | Video Compression | Image Conversion |
|---------|----------------|-------------------|------------------|
| Chrome  | 90+            | ✅                | ✅               |
| Firefox | 88+            | ✅                | ✅               |
| Safari  | 14+            | ✅                | ✅               |
| Edge    | 90+            | ✅                | ✅               |

**Requirements for Video Compression**:
- SharedArrayBuffer support
- WebAssembly support
- COOP/COEP headers (automatically configured)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **[FFmpeg.wasm](https://ffmpegwasm.netlify.app/)** - Browser-based video processing via WebAssembly
- **[Sharp](https://sharp.pixelplumbing.com/)** - High-performance Node.js image processing
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide](https://lucide.dev/)** - Beautiful & consistent icon toolkit

---

## ⭐ Star This Repo

If you find this project useful, please consider giving it a star on GitHub!

**Built with ❤️ using Next.js 15 and modern web technologies**
