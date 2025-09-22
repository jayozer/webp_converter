# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Media Optimizer is a Next.js 15 application for converting images to WebP format and compressing videos using browser-based FFmpeg. The app uses React 19 with TypeScript, Radix UI components styled with Tailwind CSS, and Sharp for server-side image processing.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Core Structure
- **`/app`**: Next.js App Router pages and API routes
  - `api/convert/route.ts`: Server-side image-to-WebP conversion using Sharp
  - `api/compress-video/route.ts`: Video compression endpoint (removed/deprecated)
  - `layout.tsx`: Root layout with metadata and font configuration
  - `page.tsx`: Home page rendering MediaConverter component

- **`/components`**: React components organized by feature
  - `media-converter.tsx`: Main tabbed interface component
  - `image-converter.tsx`: WebP conversion interface with batch processing
  - `video-compressor.tsx`: Browser-based video compression using FFmpeg.wasm
  - `/ui`: Radix UI primitives wrapped with Tailwind styling

### Key Technical Details

1. **Image Processing**: Server-side using Sharp library
   - Quality control (1-100), lossless mode, metadata preservation
   - Auto-resize for images >2048px
   - Batch processing with Promise.all

2. **Video Processing**: Client-side using @ffmpeg/ffmpeg
   - Browser-based FFmpeg.wasm for privacy (no server uploads)
   - Requires COOP/COEP headers configured in next.config.ts
   - Polyfills for process/Buffer/node modules for browser compatibility

3. **Webpack Configuration**: Custom setup in next.config.ts
   - ProvidePlugin for process/Buffer polyfills
   - NormalModuleReplacementPlugin to handle node: protocol imports
   - CORS headers for SharedArrayBuffer support

4. **Component Utilities**:
   - `lib/utils.ts`: cn() function for className merging (clsx + tailwind-merge)
   - Radix UI components use CVA (class-variance-authority) for variants

## Important Considerations

- **FFmpeg Browser Limitations**: Video compression runs client-side, requires modern browser with SharedArrayBuffer support
- **Vercel Deployment**: Video compression won't work on Vercel Hobby plan due to 60s timeout and lack of server-side FFmpeg
- **Path Aliases**: Using `@/` alias configured in tsconfig.json for absolute imports
- **Runtime**: API routes use 'nodejs' runtime for Sharp compatibility