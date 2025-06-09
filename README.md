# Media Optimizer

A professional Next.js application for optimizing images and videos for web use. Convert images to WebP format and compress videos while maintaining quality - all processing happens locally for maximum privacy.

## Features

### Image Converter
- **WebP Conversion**: Convert PNG, JPG, JPEG, GIF, BMP, and TIFF images to WebP format
- **Quality Control**: Adjustable quality slider (1-100) for perfect balance between size and quality
- **Lossless Option**: Enable lossless compression for maximum quality
- **Batch Processing**: Convert multiple images at once
- **Metadata Control**: Choose to preserve or strip image metadata
- **Transparency Support**: Maintain transparency in PNG/GIF images
- **Auto-Resize**: Automatically resize large images (>2048px) for web optimization
- **Smart Compression**: Achieve up to 75% size reduction without noticeable quality loss

### Video Compressor
- **Multiple Formats**: Support for MP4, MOV, AVI, WebM, and MKV input files
- **Output Formats**: Export to MP4, WebM, or MOV
- **Bitrate Control**: 
  - 6 preset options from Ultra Low (300kbps) to Ultra (10000kbps)
  - Custom bitrate slider for fine-tuned control
- **Advanced Options**:
  - Maintain original resolution or auto-downscale to 720p
  - Remove audio track for smaller file sizes
  - Hardware acceleration support for faster processing
- **Real-time Progress**: Track compression progress with visual indicators
- **Batch Processing**: Compress multiple videos simultaneously

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Image Processing**: Sharp (for WebP conversion)
- **Video Processing**: FFmpeg (required for video compression)
- **Styling**: Tailwind CSS with custom animations

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- FFmpeg (for video compression feature)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/webp_converter.git
cd webp_converter/webp_converter
```

2. Install dependencies:
```bash
npm install
```

3. Install FFmpeg (for video compression):

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [FFmpeg official website](https://ffmpeg.org/download.html)

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Deploy with default settings

**Note**: For video compression to work on Vercel, you'll need to use a custom runtime or external API as FFmpeg is not available in the default Vercel environment.

### Docker

A Dockerfile can be created to include FFmpeg:

```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## API Routes

### `/api/convert` - Image Conversion
- **Method**: POST
- **Body**: FormData with files and options
- **Returns**: Base64 encoded WebP images

### `/api/compress-video` - Video Compression
- **Method**: POST
- **Body**: FormData with video file and compression settings
- **Returns**: Base64 encoded compressed video

## Privacy

All file processing happens locally on the server - no files are uploaded to external services. Files are temporarily stored during processing and immediately deleted after conversion.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) for high-performance image processing
- [FFmpeg](https://ffmpeg.org/) for video processing capabilities
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling