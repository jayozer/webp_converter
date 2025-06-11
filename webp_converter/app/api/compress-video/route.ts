import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink, readFile, stat } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const maxDuration = 60 // 1 minute for video processing

// Native FFmpeg implementation (for local development)
async function compressVideoNative(
  video: File,
  options: {
    bitrate: number
    format: string
    maintainResolution: boolean
    removeAudio: boolean
  }
) {
  
  let inputPath: string | null = null
  let outputPath: string | null = null
  
  try {
    // Save uploaded file to temp directory
    const buffer = Buffer.from(await video.arrayBuffer())
    inputPath = join(tmpdir(), `input-${Date.now()}-${video.name}`)
    await writeFile(inputPath, buffer)
    
    // Prepare output path
    outputPath = join(tmpdir(), `output-${Date.now()}.${options.format}`)
    
    // Build FFmpeg command
    const parts = ['ffmpeg', '-i', `"${inputPath}"`]
    
    // Video codec based on format
    switch (options.format) {
      case 'webm':
        parts.push('-c:v', 'libvpx-vp9')
        break
      case 'mov':
        parts.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p')
        break
      default: // mp4
        parts.push('-c:v', 'libx264')
        break
    }
    
    // Bitrate
    parts.push('-b:v', `${options.bitrate}k`)
    
    // Resolution scaling
    if (!options.maintainResolution) {
      parts.push('-vf', 'scale=-2:720') // Scale to 720p maintaining aspect ratio
    }
    
    // Audio handling
    if (options.removeAudio) {
      parts.push('-an')
    } else {
      parts.push('-c:a', 'aac', '-b:a', '128k')
    }
    
    // Quality and compression settings
    parts.push(
      '-preset', 'medium',
      '-crf', '23',
      '-movflags', '+faststart',
      '-y', `"${outputPath}"`
    )
    
    const command = parts.join(' ')
    console.log('Executing native FFmpeg command:', command)
    
    await execAsync(command, { maxBuffer: 1024 * 1024 * 10 }) // 10MB buffer
    
    // Read compressed video
    const compressedBuffer = await readFile(outputPath)
    const stats = await stat(outputPath)
    
    // Clean up temp files
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {})
    ])
    
    return {
      success: true,
      originalSize: video.size,
      compressedSize: stats.size,
      videoData: compressedBuffer.toString('base64'),
      duration: 0, // Could extract with ffprobe if needed
      resolution: 'N/A'
    }
  } catch (error) {
    // Clean up temp files on error
    if (inputPath) await unlink(inputPath).catch(() => {})
    if (outputPath) await unlink(outputPath).catch(() => {})
    throw error
  }
}

// WebAssembly FFmpeg implementation (for Vercel)
async function compressVideoWasm(
  video: File,
  options: {
    bitrate: number
    format: string
    maintainResolution: boolean
    removeAudio: boolean
  }
) {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg')
  const { fetchFile, toBlobURL } = await import('@ffmpeg/util')
  
  const ffmpeg = new FFmpeg()
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })
  
  // Write input file to FFmpeg virtual file system
  const videoData = await fetchFile(video)
  await ffmpeg.writeFile('input', videoData)
  
  // Build FFmpeg arguments
  const args = ['-i', 'input']
  
  // Video codec based on format
  switch (options.format) {
    case 'webm':
      args.push('-c:v', 'libvpx-vp9')
      break
    case 'mov':
      args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p')
      break
    default: // mp4
      args.push('-c:v', 'libx264')
      break
  }
  
  // Bitrate
  args.push('-b:v', `${options.bitrate}k`)
  
  // Resolution scaling
  if (!options.maintainResolution) {
    args.push('-vf', 'scale=-2:720') // Scale to 720p maintaining aspect ratio
  }
  
  // Audio handling
  if (options.removeAudio) {
    args.push('-an')
  } else {
    args.push('-c:a', 'aac', '-b:a', '128k')
  }
  
  // Quality and compression settings
  args.push(
    '-preset', 'medium',
    '-crf', '23',
    '-movflags', '+faststart',
    `output.${options.format}`
  )
  
  console.log('Executing WebAssembly FFmpeg with args:', args)
  
  // Execute FFmpeg
  await ffmpeg.exec(args)
  
  // Read the output file
  const outputData = await ffmpeg.readFile(`output.${options.format}`)
  const outputBlob = new Blob([outputData], { type: `video/${options.format}` })
  const outputBuffer = Buffer.from(await outputBlob.arrayBuffer())
  
  // Clean up
  await ffmpeg.deleteFile('input')
  await ffmpeg.deleteFile(`output.${options.format}`)
  
  return {
    success: true,
    originalSize: video.size,
    compressedSize: outputBuffer.length,
    videoData: outputBuffer.toString('base64'),
    duration: 0,
    resolution: 'N/A'
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const video = formData.get('video') as File
    const bitrate = parseInt(formData.get('bitrate') as string) || 1500
    const format = formData.get('format') as string || 'mp4'
    const maintainResolution = formData.get('maintainResolution') === 'true'
    const removeAudio = formData.get('removeAudio') === 'true'
    
    if (!video) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }
    
    // Validate format
    const allowedFormats = ['mp4', 'webm', 'mov']
    if (!allowedFormats.includes(format)) {
      return NextResponse.json({ error: 'Invalid output format' }, { status: 400 })
    }
    
    const compressionOptions = {
      bitrate,
      format,
      maintainResolution,
      removeAudio
    }
    
    let result
    
    // Try native FFmpeg first (for local development)
    try {
      console.log('Attempting to use native FFmpeg...')
      result = await compressVideoNative(video, compressionOptions)
      console.log('Native FFmpeg compression successful')
    } catch (nativeError) {
      console.log('Native FFmpeg failed, falling back to WebAssembly FFmpeg:', nativeError)
      
      // Fall back to WebAssembly FFmpeg
      try {
        result = await compressVideoWasm(video, compressionOptions)
        console.log('WebAssembly FFmpeg compression successful')
      } catch (wasmError) {
        console.error('Both FFmpeg methods failed')
        throw wasmError
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Video compression error:', error)
    
    return NextResponse.json(
      { error: 'Failed to compress video. Please try again with a smaller file or different settings.' },
      { status: 500 }
    )
  }
}