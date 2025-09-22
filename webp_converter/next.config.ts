import type { NextConfig } from 'next'
import webpack from 'webpack'

// Next.js configuration adjusted so ffmpeg.wasm can run in browser.
// 1. Provide polyfills for `process` & `Buffer` expected by the ffmpeg bundle.
// 2. Replace `node:` protocol imports used by the library.
// 3. Add required COOP/COEP headers for SharedArrayBuffer.

const nextConfig: NextConfig = {
  webpack(config) {
    config.plugins = config.plugins || []

    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
        const mod = resource.request.replace(/^node:/, '')
        switch (mod) {
          case 'buffer':
            resource.request = 'buffer'
            break
          case 'stream':
            resource.request = 'readable-stream'
            break
          default:
            // leave as-is for unknown built-ins (should not occur here)
            break
        }
      })
    )

    return config
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
