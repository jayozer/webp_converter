import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for video processing

interface VideoMetadata {
  duration: number
  width: number
  height: number
  bitrate: number
}

async function getVideoMetadata(filePath: string): Promise<VideoMetadata> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    )
    const data = JSON.parse(stdout)
    const videoStream = data.streams.find((s: { codec_type: string }) => s.codec_type === 'video')
    
    return {
      duration: parseFloat(data.format.duration),
      width: videoStream?.width || 0,
      height: videoStream?.height || 0,
      bitrate: parseInt(data.format.bit_rate) || 0
    }
  } catch (error) {
    console.error('Error getting video metadata:', error)
    throw error
  }
}

function getFFmpegCommand(
  inputPath: string,
  outputPath: string,
  options: {
    bitrate: number
    format: string
    maintainResolution: boolean
    removeAudio: boolean
    useHardwareAcceleration: boolean
  }
): string {
  const parts = ['ffmpeg', '-i', `"${inputPath}"`]
  
  // Hardware acceleration (if available)
  if (options.useHardwareAcceleration) {
    // Try to use hardware acceleration - this will fail gracefully if not available
    parts.unshift('-hwaccel', 'auto')
  }
  
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
    '-movflags', '+faststart'
  )
  
  // Output file
  parts.push('-y', `"${outputPath}"`)
  
  return parts.join(' ')
}

export async function POST(request: NextRequest) {
  let inputPath: string | null = null
  let outputPath: string | null = null
  
  try {
    const formData = await request.formData()
    const video = formData.get('video') as File
    const bitrate = parseInt(formData.get('bitrate') as string) || 1500
    const format = formData.get('format') as string || 'mp4'
    const maintainResolution = formData.get('maintainResolution') === 'true'
    const removeAudio = formData.get('removeAudio') === 'true'
    const useHardwareAcceleration = formData.get('useHardwareAcceleration') === 'true'
    
    if (!video) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }
    
    // Validate format
    const allowedFormats = ['mp4', 'webm', 'mov']
    if (!allowedFormats.includes(format)) {
      return NextResponse.json({ error: 'Invalid output format' }, { status: 400 })
    }
    
    // Save uploaded file to temp directory
    const buffer = Buffer.from(await video.arrayBuffer())
    inputPath = join(tmpdir(), `input-${Date.now()}-${video.name}`)
    await writeFile(inputPath, buffer)
    
    // Get video metadata
    const metadata = await getVideoMetadata(inputPath)
    
    // Prepare output path
    outputPath = join(tmpdir(), `output-${Date.now()}.${format}`)
    
    // Build and execute FFmpeg command
    const command = getFFmpegCommand(inputPath, outputPath, {
      bitrate,
      format,
      maintainResolution,
      removeAudio,
      useHardwareAcceleration
    })
    
    console.log('Executing FFmpeg command:', command)
    
    try {
      await execAsync(command, { maxBuffer: 1024 * 1024 * 10 }) // 10MB buffer
    } catch (ffmpegError) {
      console.error('FFmpeg error:', ffmpegError)
      
      // Check if it's a hardware acceleration error and retry without it
      if (useHardwareAcceleration && ffmpegError instanceof Error && ffmpegError.message.includes('hwaccel')) {
        console.log('Retrying without hardware acceleration...')
        const fallbackCommand = getFFmpegCommand(inputPath, outputPath, {
          bitrate,
          format,
          maintainResolution,
          removeAudio,
          useHardwareAcceleration: false
        })
        await execAsync(fallbackCommand, { maxBuffer: 1024 * 1024 * 10 })
      } else {
        throw ffmpegError
      }
    }
    
    // Read compressed video
    const { readFile, stat } = await import('fs/promises')
    const compressedBuffer = await readFile(outputPath)
    const stats = await stat(outputPath)
    
    // Get output metadata for resolution info
    const outputMetadata = await getVideoMetadata(outputPath)
    
    // Clean up temp files
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {})
    ])
    
    return NextResponse.json({
      success: true,
      originalSize: video.size,
      compressedSize: stats.size,
      videoData: compressedBuffer.toString('base64'),
      duration: metadata.duration,
      resolution: `${outputMetadata.width}x${outputMetadata.height}`
    })
    
  } catch (error) {
    console.error('Video compression error:', error)
    
    // Clean up temp files on error
    if (inputPath) await unlink(inputPath).catch(() => {})
    if (outputPath) await unlink(outputPath).catch(() => {})
    
    // Check if FFmpeg is installed
    if (error instanceof Error && error.message.includes('ffmpeg')) {
      return NextResponse.json(
        { error: 'FFmpeg is not installed on the server. Please install FFmpeg to use video compression.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to compress video. Please try again with a smaller file or different settings.' },
      { status: 500 }
    )
  }
}