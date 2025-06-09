# FFmpeg Setup for Video Compression

The video compression feature requires FFmpeg to be installed on your system.

## Installation

### macOS
```bash
# Using Homebrew
brew install ffmpeg

# Or using MacPorts
sudo port install ffmpeg
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

### Windows
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract the archive
3. Add the `bin` folder to your system PATH

### Docker/Production
If deploying with Docker, add this to your Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

## Verify Installation
```bash
ffmpeg -version
```

## Supported Formats
- Input: MP4, MOV, AVI, WebM, MKV
- Output: MP4, WebM, MOV

## Features
- Hardware acceleration (when available)
- Custom bitrate control
- Resolution scaling
- Audio removal option
- Multiple quality presets