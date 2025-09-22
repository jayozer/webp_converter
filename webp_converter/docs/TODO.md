# Video Compression Features TODO

This document lists potential features that could be added to the video compression tool, inspired by Handbrake and other professional video processing applications.

## Video Filters
- [ ] **Deinterlacing** - Fix interlaced video from old cameras/broadcasts
- [ ] **Denoise** - Remove grain/noise from videos
- [ ] **Sharpen** - Enhance video clarity
- [ ] **Rotation** - Rotate videos 90°, 180°, 270°
- [ ] **Crop** - Remove black bars or unwanted edges

## Frame Rate Control
- [ ] Convert between common frame rates (60fps → 30fps, 24fps)
- [ ] Useful for reducing file size of screen recordings
- [ ] Preserve smooth motion where needed

## Encoding Improvements
- [ ] **Two-Pass Encoding** - Better quality at same file size by analyzing video first
- [ ] Takes longer but produces superior results
- [ ] Show progress for both passes

## Preset Profiles
- [ ] **Web Streaming** - Optimized for fast loading and progressive playback
- [ ] **Social Media** - Meet platform requirements
  - [ ] Instagram (square/vertical, max 60s)
  - [ ] TikTok (vertical, specific bitrates)
  - [ ] Twitter/X (max 512MB, specific codecs)
  - [ ] YouTube (recommended settings)
- [ ] **Email Friendly** - Ultra compressed for email attachments (< 25MB)
- [ ] **Archive** - High quality for long-term storage

## Video Preview & Analysis
- [ ] Show before/after preview frames
- [ ] Display detailed video metadata
  - [ ] Codec information
  - [ ] Bitrate analysis
  - [ ] Frame rate
  - [ ] Color space
- [ ] Visual quality comparison

## Batch Processing
- [ ] Save custom compression profiles
- [ ] Apply same settings to multiple videos
- [ ] Queue management with individual progress
- [ ] Batch naming patterns

## Advanced Audio Options
- [ ] Audio bitrate control (separate from video)
- [ ] Audio normalization (consistent volume)
- [ ] Convert to mono for smaller size
- [ ] Audio codec selection (AAC, MP3, Opus)
- [ ] Remove specific audio tracks (multi-language videos)

## Video Editing
- [ ] **Trim/Cut** - Set start and end times
- [ ] **Extract Segments** - Save specific portions
- [ ] **Chapter Support** - Preserve or add chapter markers
- [ ] **Merge Videos** - Combine multiple videos into one

## Performance & UX
- [ ] Real-time compression estimation
- [ ] Pause/Resume compression
- [ ] Better progress indication with time remaining
- [ ] Compression history with settings used
- [ ] Drag & drop folders for batch processing

## Technical Enhancements
- [ ] WebAssembly SIMD support for faster processing
- [ ] Worker threads for non-blocking compression
- [ ] Streaming compression for very large files
- [ ] Resume failed compressions

## Platform-Specific Features
- [ ] Desktop app with native FFmpeg (Electron/Tauri)
- [ ] CLI tool for automation
- [ ] API for programmatic access
- [ ] Webhook notifications for completion

## Priority Recommendations

### High Priority (Most Requested/Useful)
1. Frame Rate Control
2. Video Rotation
3. Social Media Presets
4. Trim/Cut functionality

### Medium Priority
1. Two-Pass Encoding
2. Audio bitrate control
3. Video preview
4. Batch processing

### Low Priority (Nice to Have)
1. Advanced filters (denoise, sharpen)
2. Chapter support
3. Desktop app
4. API access