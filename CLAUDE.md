# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Media Optimizer is a Next.js 15 privacy-first application for converting images to WebP and compressing videos. **All processing happens entirely in the browser** using Canvas API for images and FFmpeg.wasm for videos. Built with React 19, TypeScript, Radix UI components, and Tailwind CSS 4.

## Development Commands

**Working Directory**: All commands must be run from `webp_converter/` subdirectory.

```bash
cd webp_converter/

# Install dependencies
npm install

# Run development server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Privacy-First Client-Side Processing

**Critical Principle**: NO server-side processing. All media operations happen in the browser:

```
User's Browser Only:
┌─────────────────────────────────────────┐
│  1. File selected                        │
│  2. Processed in browser memory          │
│     • Images: Canvas API (native WebP)  │
│     • Videos: FFmpeg.wasm (WebAssembly) │
│  3. Download processed file              │
│                                          │
│  ✅ No uploads to server                │
│  ✅ No backend API endpoints             │
│  ✅ Works offline after initial load     │
└─────────────────────────────────────────┘
```

### Core Structure

```
webp_converter/
├── app/
│   ├── layout.tsx          # Root layout (Geist fonts, metadata)
│   ├── page.tsx            # Home page (renders MediaConverter)
│   ├── globals.css         # Tailwind v4 + oklch design tokens
│   └── api/                # Empty/deprecated (legacy server routes)
├── components/
│   ├── media-converter.tsx    # Main tabbed interface
│   ├── image-converter.tsx    # Canvas API image processing
│   ├── video-compressor.tsx   # FFmpeg.wasm video compression
│   └── ui/                    # Radix UI primitives (shadcn)
├── lib/
│   └── utils.ts               # cn() helper (clsx + tailwind-merge)
├── next.config.ts             # Webpack polyfills + COOP/COEP headers
├── components.json            # shadcn UI configuration
└── tsconfig.json              # Path alias: @/* → ./*
```

### Key Technical Details

#### 1. Image Processing (Client-Side Canvas API)

**Implementation**: `components/image-converter.tsx`

- **Native WebP Encoding**: Browser's Canvas API `.toBlob('image/webp', quality)`
- **Transparency Preservation**: Canvas alpha channel automatically maintained for PNG/GIF
- **Batch Processing**: `Promise.all()` parallel conversion
- **Quality Control**: 0-100 slider (lossy) or lossless mode (quality: 1.0)
- **Auto-Resize**: Optional downscale for images >2048px

**Pattern**:
```typescript
const convertImageToWebP = (file: File): Promise<Blob> => {
  const img = new Image()
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  img.onload = () => {
    canvas.width = width
    canvas.height = height
    ctx.drawImage(img, 0, 0, width, height)

    canvas.toBlob(
      (blob) => resolve(blob),
      'image/webp',
      losslessConversion ? 1.0 : quality / 100
    )
  }

  img.src = URL.createObjectURL(file)
}
```

#### 2. Video Processing (Client-Side FFmpeg.wasm)

**Implementation**: `components/video-compressor.tsx`

- **Lazy Loading**: FFmpeg.wasm loaded on first compression (not at page load)
- **CDN Source**: `unpkg.com/@ffmpeg/core@0.12.6`
- **Instance Reuse**: Single FFmpeg instance processes all files sequentially
- **Progress Tracking**: Real-time progress via `ffmpeg.on('progress')` listener
- **Virtual Filesystem**: Write input → process → read output → cleanup pattern

**Supported Formats**:
- **Input**: MP4, MOV, AVI, WebM, MKV
- **Output**: MP4 (H.264/AAC), WebM (VP8/Opus), MOV (H.264/AAC)

**Codec Configurations**:
```typescript
// WebM: VP8 video (constrained quality) + Opus audio
'-c:v', 'libvpx', '-b:v', `${bitrate}k`, '-crf', '10',
'-deadline', 'realtime', '-cpu-used', '4'
'-c:a', 'libopus', '-b:a', '64k', '-ac', '1'

// MP4/MOV: H.264 video + AAC audio
'-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-b:v', `${bitrate}k`
'-c:a', 'aac', '-b:a', '128k', '-ac', '2'
```

**Single-Pass Encoding** (all formats use single-pass):
- All formats (MP4, WebM, MOV) use single-pass encoding
- Audio stream mapping is implicit (FFmpeg auto-selects if present, skips if absent)
- Exit code of `ffmpeg.exec()` is checked; non-zero throws an error

**FFmpeg Virtual Filesystem Pattern**:
```typescript
// Write input to virtual FS (preserves original extension for format detection)
await ffmpeg.writeFile(`input-${file.id}.${ext}`, fileData)

// Execute compression and check exit code
const exitCode = await ffmpeg.exec(args)
if (exitCode !== 0) throw new Error(`FFmpeg exited with code ${exitCode}`)

// Read output from virtual FS
const outputData = await ffmpeg.readFile(outputName)
const blob = new Blob([outputData], { type: `video/${targetFormat}` })

// Always cleanup (even on error)
finally {
  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)
}
```

#### 3. Webpack Configuration (next.config.ts)

**Required for FFmpeg.wasm browser compatibility**:

```typescript
// 1. Polyfills for Node.js globals
ProvidePlugin({
  process: 'process/browser',
  Buffer: ['buffer', 'Buffer'],
})

// 2. Replace node: protocol imports
NormalModuleReplacementPlugin(/node:/, (resource) => {
  'node:buffer' → 'buffer'
  'node:stream' → 'readable-stream'
})

// 3. COOP/COEP headers for SharedArrayBuffer
headers: [
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }
]
```

**Why Required**:
- FFmpeg.wasm needs `SharedArrayBuffer` (requires COOP/COEP headers)
- FFmpeg bundle expects `process` and `Buffer` globals
- Library uses `node:` protocol imports that webpack must resolve

#### 4. UI Components & Styling

**Radix UI (shadcn/ui)**:
- Configuration: `components.json` (style: "new-york", baseColor: "stone")
- Path aliases: `@/components/ui`, `@/lib/utils`
- Icons: Lucide React
- Component variants: CVA (class-variance-authority)

**Tailwind CSS v4**:
- Inline theme with `@theme` directive in `globals.css`
- Design tokens: oklch color system for better color perception
- Custom CSS variables: `--radius`, `--background`, `--foreground`, etc.
- Dark mode: `.dark` class variant

**cn() Utility** (`lib/utils.ts`):
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Important Considerations

### Browser Requirements

**Images (Canvas API)**:
- WebP support: Chrome 23+, Firefox 65+, Safari 14+, Edge 18+
- All modern browsers supported

**Videos (FFmpeg.wasm)**:
- SharedArrayBuffer support: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- WASM support required
- COOP/COEP headers must be enabled (configured in next.config.ts)

### Deployment Notes

- **Vercel/Netlify/Any Host**: Works perfectly (all processing is client-side)
- **No Server Requirements**: Just static Next.js hosting
- **No FFmpeg Installation**: Everything runs in browser via WebAssembly
- **No Special Runtime**: Standard Node.js for Next.js build only

### Path Aliases

- `@/*` maps to `webp_converter/*` root
- Example: `@/components/ui/button` → `webp_converter/components/ui/button.tsx`

### Working with FFmpeg.wasm

**When modifying video compression**:
1. Test codec changes with small files first
2. Monitor browser console for FFmpeg logs (`ffmpeg.on('log')`)
3. Always cleanup temp files in `finally` blocks
4. Remember: sequential processing (one video at a time with shared FFmpeg instance)
5. Multi-pass encoding for WebM with audio requires temp file tracking

**Debugging FFmpeg Commands**:
- FFmpeg args are standard CLI format: `['-i', 'input.mp4', '-c:v', 'libx264', 'output.mp4']`
- Check browser console for `ffmpeg.on('log')` output
- Virtual filesystem files persist until manually deleted

### Migration Notes

**Recent Changes** (as of latest commits):
- ✅ Image processing migrated from Sharp (server) to Canvas API (client)
- ✅ All server-side API routes deprecated/removed
- ✅ 100% privacy-first architecture (no server uploads)
- ⚠️ Legacy `api/` directory may contain empty/deprecated routes
