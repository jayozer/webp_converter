# FFmpeg.wasm v0.12 Integration Guide for Next.js

## Overview
This guide documents the proper implementation of @ffmpeg/ffmpeg v0.12 in our Next.js application for browser-based video compression.

## Key Changes from v0.11 to v0.12

### 1. Import Changes
**Old (v0.11):**
```javascript
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
```

**New (v0.12):**
```javascript
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
```

### 2. Initialization Changes
**Old (v0.11):**
```javascript
const ffmpeg = createFFmpeg({
  log: true,
  corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
});
await ffmpeg.load();
```

**New (v0.12):**
```javascript
const ffmpeg = new FFmpeg();
await ffmpeg.load({
  coreURL: '/ffmpeg-core.js',
  wasmURL: '/ffmpeg-core.wasm',
  workerURL: '/ffmpeg-core.worker.js'
});
```

### 3. API Method Changes
- `ffmpeg.FS()` → `ffmpeg.writeFile()` and `ffmpeg.readFile()`
- Progress handling has been updated
- `exec()` method now takes an array of arguments

## Implementation Steps

### Step 1: Update Dependencies
```bash
npm install @ffmpeg/ffmpeg@latest @ffmpeg/util@latest @ffmpeg/core-mt@latest
```

### Step 2: Update Video Compressor Component
The main changes needed:
1. Fix imports to use new API
2. Update FFmpeg initialization
3. Modify file operations to use new methods
4. Update progress handling

### Step 3: Configure Next.js
Update `next.config.ts` to properly handle:
- WebAssembly modules
- Cross-Origin headers for SharedArrayBuffer
- Worker scripts

### Step 4: Copy Core Files
Copy FFmpeg core files to public directory:
- ffmpeg-core.js
- ffmpeg-core.wasm
- ffmpeg-core.worker.js

## Working Example

```javascript
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

// Initialize with CDN or local files
const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
await ffmpeg.load({
  coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
  wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
});

// Write file
await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

// Execute compression
await ffmpeg.exec(['-i', 'input.mp4', '-c:v', 'libx264', '-crf', '28', 'output.mp4']);

// Read result
const data = await ffmpeg.readFile('output.mp4');
const blob = new Blob([data], { type: 'video/mp4' });
```

## Browser Compatibility
- Requires SharedArrayBuffer support
- Chrome 68+, Firefox 79+, Safari 15.2+
- Mobile browsers may have limited support

## Performance Considerations
- File size limit: ~2GB in browser memory
- Processing is CPU intensive
- Provide progress indicators
- Consider chunked processing for large files

## Troubleshooting

### Common Issues:
1. **"createFFmpeg is not a function"**: Using old v0.11 syntax with v0.12
2. **CORS errors**: Missing headers in next.config.ts
3. **Worker loading issues**: Incorrect file paths or missing files
4. **SharedArrayBuffer not defined**: Browser doesn't support or headers not set

### Solutions:
1. Update to new API syntax
2. Configure proper CORS headers
3. Ensure core files are accessible
4. Check browser compatibility