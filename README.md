# Media Optimizer

[![Try Live Demo](https://img.shields.io/badge/Try%20Live%20Demo-Visit%20App-blue?style=for-the-badge&logo=vercel)](https://popmedia.vercel.app)

**Optimize images and compress videos directly in your browser - no uploads, complete privacy.**

A modern Next.js application for converting images to WebP format and compressing videos. Built with 100% privacy-first architecture where ALL processing (images and videos) happens entirely in your browser using native Canvas API and FFmpeg.wasm.

---

## ✨ Why This App is Different

### 🔒 **100% Privacy-First Processing**
Your images AND videos **never leave your computer**. All processing happens directly in your browser:
- **Images**: Native Canvas API with built-in WebP encoding
- **Videos**: FFmpeg.wasm (WebAssembly)
No server uploads, no cloud processing, complete privacy guaranteed.

### ⚡ **Modern Web Technologies**
- **Canvas API**: Browser-native image processing with WebP support
- **FFmpeg.wasm**: Full-featured video processing running as WebAssembly
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

### 🖼️ Image Converter (Browser-Based)
**Powered by Native Canvas API - 100% client-side processing**

- **Complete Privacy**: Images never uploaded to servers - all processing happens in your browser
- **WebP Conversion**: Convert PNG, JPG, JPEG, GIF, BMP, TIFF to WebP
- **Quality Control**: Adjustable quality slider (1-100)
- **Lossless Mode**: Zero quality loss compression
- **Batch Processing**: Convert multiple images at once
- **Advanced Options**:
  - Automatic transparency preservation (PNG/GIF alpha channels)
  - Auto-resize large images (>2048px) for web optimization
- **Smart Compression**: Up to 80% size reduction
- **No Size Limits**: Process large images without server timeouts

---

## 🏗️ Architecture

### How It Works - 100% Client-Side Processing

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
│  IMAGE CONVERSION (Client-Side)                         │
│                                                          │
│  Your Browser                                            │
│  ┌────────────────────────────────────────────┐         │
│  │ 1. Select image file                       │         │
│  │ 2. Canvas API processes image              │         │
│  │ 3. Native WebP encoding in browser         │         │
│  │ 4. Download WebP image                     │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ✅ Image never leaves your computer                    │
│  ✅ No server uploads or cloud processing               │
│  ✅ Works offline after initial page load               │
└─────────────────────────────────────────────────────────┘

Both images and videos are processed entirely in your browser for
complete privacy and security. No data is ever sent to any server!
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
- **Canvas API**: Native browser WebP encoding (no external dependencies!)
- **FFmpeg.wasm** (v0.12.15): Browser-based video compression via WebAssembly

### Key Dependencies
- `@ffmpeg/ffmpeg`: WebAssembly FFmpeg for in-browser video processing
- `@radix-ui/*`: Accessible component primitives
- `lucide-react`: Modern icon library

---

## 📦 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**

**Note**: No FFmpeg or image processing library installation required! All processing uses browser-native APIs and FFmpeg.wasm.

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

**✅ Both image and video processing work perfectly on Vercel** (and any hosting platform) because everything runs client-side in the browser, not on the server!

### Environment Requirements

**Browser Requirements**:
- Modern browser with WebP support (Chrome 23+, Firefox 65+, Safari 14+, Edge 18+)
- For video compression: SharedArrayBuffer support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- COOP/COEP headers enabled (configured in `next.config.ts`)

**Server Requirements**:
- Minimal! Just serve the static Next.js app
- No special image processing libraries needed
- No FFmpeg installation required

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

**Note**: No need to install FFmpeg or Sharp in Docker - all processing is browser-based!

---

## 🔒 Privacy & Security

### Complete Privacy Guarantee
- **100% Browser-Based Processing**: ALL media (images and videos) processed entirely in your browser
- **Zero Server Upload**: Your files never leave your device
- **No Data Collection**: No tracking, no analytics, no logging
- **Offline-Capable**: After initial page load, works without internet
- **Open Source**: Transparent code you can audit

### How We Ensure Privacy
- **Images**: Native Canvas API processes images directly in browser memory
- **Videos**: FFmpeg.wasm (WebAssembly) runs locally without server communication
- **No Backend API**: No server-side processing endpoints exist
- **No Database**: No file storage or metadata collection

---

## 🌍 Browser Support

| Browser | Minimum Version | Image Conversion | Video Compression |
|---------|----------------|------------------|-------------------|
| Chrome  | 23+ (90+ for video) | ✅          | ✅                |
| Firefox | 65+ (88+ for video) | ✅          | ✅                |
| Safari  | 14+            | ✅                | ✅               |
| Edge    | 18+ (90+ for video) | ✅          | ✅                |

**Requirements**:
- **Image Conversion**: WebP support (all modern browsers)
- **Video Compression**: SharedArrayBuffer + WebAssembly support
- COOP/COEP headers (automatically configured in next.config.ts)

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
- **[Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)** - Native browser image processing with WebP support
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide](https://lucide.dev/)** - Beautiful & consistent icon toolkit

---

## ⭐ Star This Repo

If you find this project useful, please consider giving it a star on GitHub!

**Built with ❤️ using Next.js 15 and modern web technologies**
