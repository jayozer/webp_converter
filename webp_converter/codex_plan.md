# Plan to integrate ffmpeg.wasm for video processing on Vercel

This document captures the implementation strategy before any code changes are applied.

--------------------------------------------------
## 1. Dependencies

* Add `@ffmpeg/ffmpeg` and `@ffmpeg/core` (version `0.11.x`, the same versions used in the working demo found in `docs/ffmpeg-online.txt`).
* No native FFmpeg binary will be required any longer.

## 2. Static core files

**Option A – CDN (default)**  
Serve core assets from `https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.{js,wasm,worker.js}`. This keeps the bundle small.

**Option B – Self-host (alternate)**  
Copy `docs/ffmpeg-online/public/static/v0.11.0/` into `/public/static/v0.11.0` and reference them with `/static/...` paths. The code will support an override via env-var.

## 3. `next.config.ts` adjustments

* Provide polyfills so FFmpeg’s ESM bundle compiles in the browser:

```ts
const webpack = require('webpack');

export default {
  webpack(cfg) {
    cfg.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.NormalModuleReplacementPlugin(/node:/, resource => {
        const mod = resource.request.replace(/^node:/, '');
        if (mod === 'buffer') resource.request = 'buffer';
        else if (mod === 'stream') resource.request = 'readable-stream';
      }),
    );
    return cfg;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
        ],
      },
    ];
  },
};
```

These COEP/COOP headers are mandatory for SharedArrayBuffer support, which ffmpeg.wasm uses for multi-threading.

## 4. Remove server-side FFmpeg usage

* Delete `/app/api/compress-video` (and its entry in `vercel.json`).
* Rationale: Vercel serverless functions have no native FFmpeg and running ffmpeg.wasm in Node Lambdas is impractical. Moving all work to the browser resolves the environment issue entirely.

## 5. Client-side implementation

* Refactor `components/video-compressor.tsx`:
  * Import `createFFmpeg` / `fetchFile`.
  * Initialise a singleton ffmpeg instance with `corePath` pointing to CDN assets.
  * Write the uploaded video into the in-memory FS, execute compression arguments, read the output, then clean up.
  * Drive UI progress with `ffmpeg.setProgress` instead of the current fake interval.

Pseudo-snippet:

```ts
const ffmpeg = useRef<ReturnType<typeof createFFmpeg>>();
const init = async () => {
  if (ffmpeg.current) return;
  ffmpeg.current = createFFmpeg({
    log: true,
    corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
  });
  await ffmpeg.current.load();
};

await init();
await ffmpeg.current.FS('writeFile', 'input', await fetchFile(file));
await ffmpeg.current.run('-i', 'input', /* …options… */, 'output.mp4');
const data = ffmpeg.current.FS('readFile', 'output.mp4');
```

## 6. Cleanup / limits

* Remove the artificial progress timer.
* Warn users when files > 100 MB (browser memory limits).

## 7. Documentation

* Update README with a “Running on Vercel – ffmpeg.wasm” section describing the headers and the switch to client-side processing.

## 8. Testing checklist

* `npm run dev` – confirm local compression works in-browser.
* `next build && next start` – ensure no build errors and headers compile.
* Deploy preview to Vercel – verify response headers and that ffmpeg.wasm loads from CDN and functions correctly.

---

If this plan looks good, coding steps will include:

1. Install deps.
2. Patch `next.config.ts` and `vercel.json`.
3. Remove serverless route.
4. Refactor `video-compressor.tsx`.
5. Add documentation.