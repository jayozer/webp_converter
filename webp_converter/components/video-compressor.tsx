"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  Download, 
  Info, 
  Film, 
  Settings2,
  Zap,
  AlertCircle
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface VideoFile {
  id: string
  file: File
  name: string
  originalSize: number
  compressedSize?: number
  compressedBlob?: Blob
  reduction?: number
  status: "pending" | "compressing" | "completed" | "failed"
  error?: string
  progress?: number
  duration?: number
  resolution?: string
}

interface CompressionPreset {
  name: string
  bitrate: number
  description: string
  icon: React.ReactNode
}

const compressionPresets: CompressionPreset[] = [
  { 
    name: "Ultra Low", 
    bitrate: 300, 
    description: "Maximum compression, minimal quality",
    icon: <Zap className="h-4 w-4" />
  },
  { 
    name: "Low", 
    bitrate: 750, 
    description: "High compression, acceptable quality",
    icon: <Zap className="h-4 w-4" />
  },
  { 
    name: "Medium", 
    bitrate: 1500, 
    description: "Balanced compression and quality",
    icon: <Zap className="h-4 w-4" />
  },
  { 
    name: "High", 
    bitrate: 3000, 
    description: "Good quality, moderate file size",
    icon: <Zap className="h-4 w-4" />
  },
  { 
    name: "Very High", 
    bitrate: 6000, 
    description: "Excellent quality, larger file size",
    icon: <Zap className="h-4 w-4" />
  },
  { 
    name: "Ultra", 
    bitrate: 10000, 
    description: "Near-original quality",
    icon: <Zap className="h-4 w-4" />
  }
]

export default function VideoCompressor() {
  const [files, setFiles] = useState<VideoFile[]>([])
  const [selectedPreset, setSelectedPreset] = useState<CompressionPreset>(compressionPresets[2])
  const [customBitrate, setCustomBitrate] = useState(1500)
  const [useCustomBitrate, setUseCustomBitrate] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [maintainResolution, setMaintainResolution] = useState(true)
  const [removeAudio, setRemoveAudio] = useState(false)
  const [targetFormat, setTargetFormat] = useState("mp4")

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList)
      .filter(file => file.type.startsWith('video/'))
      .map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        originalSize: file.size,
        status: "pending" as const,
        progress: 0,
      }))
    setFiles(prev => [...prev, ...newFiles])
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const estimateCompressedSize = (originalSize: number, bitrate: number): number => {
    // Rough estimation based on bitrate
    const reductionFactor = bitrate / 10000 // Assuming original is ~10000kbps
    return Math.floor(originalSize * reductionFactor * 0.8) // 0.8 for additional compression efficiency
  }

  /* ------------------------------------------------------------------ */
  /* FFmpeg (WebAssembly) setup                                         */
  /* ------------------------------------------------------------------ */

  // We lazily instantiate FFmpeg so the heavy wasm code only loads when
  // compression is requested. The instance is reused across files.
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)

  const loadFFmpeg = async () => {
    if (ffmpegRef.current && ffmpegLoaded) return ffmpegRef.current

    const ffmpeg = new FFmpeg()

    // Set up progress listener
    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      // Update progress for the file being compressed
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'compressing'
            ? { ...f, progress: Math.min(99, Math.round(progress * 100)) }
            : f
        )
      )
    })

    ffmpeg.on('log', ({ message }: { message: string }) => {
      console.log(message)
    })

    // Load FFmpeg using CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    ffmpegRef.current = ffmpeg
    setFfmpegLoaded(true)
    return ffmpeg
  }

  const handleCompress = async () => {
    if (files.length === 0) return
    setIsCompressing(true)

    const bitrate = useCustomBitrate ? customBitrate : selectedPreset.bitrate

    try {
      const ffmpeg = await loadFFmpeg()

      for (const file of files) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: 'compressing' as const, progress: 0 } : f
          )
        )

        const inputName = `input-${file.id}.mp4`
        const outputName = `output.${targetFormat}`
        const isWebM = targetFormat === 'webm'
        const tempFiles: string[] = []

        try {
          // Write file to virtual file system
          const fileData = await fetchFile(file.file)
          await ffmpeg.writeFile(inputName, fileData)

          const baseArgs: string[] = ['-i', inputName, '-map', '0:v:0']

          switch (targetFormat) {
            case 'webm': {
              baseArgs.push(
                '-c:v',
                'libvpx',
                '-quality',
                'good',
                '-deadline',
                'realtime',
                '-cpu-used',
                '4'
              )
              break
            }
            case 'mov': {
              baseArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p')
              break
            }
            default: {
              baseArgs.push('-c:v', 'libx264')
              break
            }
          }

          baseArgs.push('-b:v', `${bitrate}k`)
          baseArgs.push(
            '-vf',
            maintainResolution
              ? 'format=yuv420p'
              : 'scale=-2:720:flags=lanczos,format=yuv420p'
          )
          baseArgs.push('-pix_fmt', 'yuv420p', '-sn', '-dn', '-map_metadata', '-1')

          if (!isWebM) {
            baseArgs.push('-preset', 'medium')
          }

          baseArgs.push('-crf', '23')

          if (!isWebM) {
            baseArgs.push('-movflags', '+faststart')
          }

          if (isWebM && !removeAudio) {
            const videoTempName = `video-${file.id}.webm`
            const audioTempName = `audio-${file.id}.opus`
            tempFiles.push(videoTempName, audioTempName)

            await ffmpeg.exec([...baseArgs, '-an', videoTempName])

            await ffmpeg.exec([
              '-i',
              inputName,
              '-map',
              '0:a:0',
              '-vn',
              '-sn',
              '-dn',
              '-map_metadata',
              '-1',
              '-c:a',
              'libopus',
              '-b:a',
              '64k',
              '-ac',
              '1',
              '-ar',
              '48000',
              audioTempName,
            ])

            await ffmpeg.exec([
              '-i',
              videoTempName,
              '-i',
              audioTempName,
              '-map',
              '0:v:0',
              '-map',
              '1:a:0',
              '-c',
              'copy',
              outputName,
            ])
          } else {
            const finalArgs = [...baseArgs]

            if (removeAudio) {
              finalArgs.push('-an')
            } else {
              finalArgs.push('-map', '0:a:0')
              if (isWebM) {
                finalArgs.push(
                  '-c:a',
                  'libopus',
                  '-b:a',
                  '64k',
                  '-ac',
                  '1',
                  '-ar',
                  '48000'
                )
              } else {
                finalArgs.push('-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '48000')
              }
            }

            finalArgs.push(outputName)

            await ffmpeg.exec(finalArgs)
          }

          const outputData = await ffmpeg.readFile(outputName)
          const blob = new Blob([outputData as BlobPart], { type: `video/${targetFormat}` })

          setFiles((prev) =>
            prev.map((f) => {
              if (f.id === file.id) {
                return {
                  ...f,
                  compressedSize: blob.size,
                  compressedBlob: blob,
                  reduction: Math.round(((f.originalSize - blob.size) / f.originalSize) * 100),
                  status: 'completed' as const,
                  progress: 100,
                }
              }
              return f
            })
          )
        } catch (error) {
          console.error('Compression error:', error)
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, status: 'failed' as const, error: 'Compression failed', progress: 0 } : f
            )
          )
        } finally {
          try {
            await ffmpeg.deleteFile(inputName)
          } catch {
            // ignore cleanup errors
          }
          try {
            await ffmpeg.deleteFile(outputName)
          } catch {
            // ignore cleanup errors
          }
          for (const temp of tempFiles) {
            try {
              await ffmpeg.deleteFile(temp)
            } catch {
              // ignore cleanup errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load FFmpeg:', error)
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'failed' as const, error: 'Failed to load FFmpeg', progress: 0 }))
      )
    }

    setIsCompressing(false)
  }

  const downloadFile = (file: VideoFile) => {
    if (!file.compressedBlob) return
    
    const url = URL.createObjectURL(file.compressedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name.replace(/\.[^/.]+$/, `.${targetFormat}`)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const completedFiles = files.filter(f => f.status === 'completed')
  const totalOriginalSize = files.reduce((acc, file) => acc + file.originalSize, 0)
  const totalCompressedSize = files.reduce((acc, file) => acc + (file.compressedSize || 0), 0)
  const totalReduction = totalOriginalSize > 0 ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100) : 0

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Settings Section */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload & Compress
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Compression Presets */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-medium">Compression Preset</Label>
                <Badge variant={useCustomBitrate ? "secondary" : "default"}>
                  {useCustomBitrate ? `Custom: ${customBitrate}kbps` : selectedPreset.name}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {compressionPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant={selectedPreset.name === preset.name && !useCustomBitrate ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      setSelectedPreset(preset)
                      setUseCustomBitrate(false)
                    }}
                    disabled={useCustomBitrate}
                  >
                    {preset.icon}
                    <span className="ml-2">{preset.name}</span>
                  </Button>
                ))}
              </div>

              {/* Custom Bitrate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-bitrate" className="text-sm flex items-center gap-2">
                    Custom Bitrate
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Set a custom bitrate in kbps. Higher values mean better quality but larger files. Typical ranges: 300-1000 (low), 1000-3000 (medium), 3000-10000 (high).</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Switch
                    id="custom-bitrate"
                    checked={useCustomBitrate}
                    onCheckedChange={setUseCustomBitrate}
                  />
                </div>
                {useCustomBitrate && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">300</span>
                    <Slider
                      min={300}
                      max={10000}
                      step={100}
                      value={[customBitrate]}
                      onValueChange={(value) => setCustomBitrate(value[0])}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500">10K</span>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-medium">Advanced Options</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTargetFormat("mp4")}>
                      Output: MP4 {targetFormat === "mp4" && "✓"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTargetFormat("webm")}>
                      Output: WebM {targetFormat === "webm" && "✓"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTargetFormat("mov")}>
                      Output: MOV {targetFormat === "mov" && "✓"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintain-res" className="font-normal cursor-pointer flex items-center gap-2">
                    Maintain Resolution
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Keep the original video resolution. Disable to automatically downscale to 720p for additional size reduction.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Switch
                    id="maintain-res"
                    checked={maintainResolution}
                    onCheckedChange={setMaintainResolution}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="remove-audio" className="font-normal cursor-pointer flex items-center gap-2">
                    Remove Audio
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Strip audio track from the video to reduce file size. Useful for background videos or GIF-like content.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Switch
                    id="remove-audio"
                    checked={removeAudio}
                    onCheckedChange={setRemoveAudio}
                  />
                </div>

              </div>
            </div>

            {/* File Upload Area */}
            <div>
              <h3 className="text-base font-medium mb-3">Select Videos</h3>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}
                  ${files.length > 0 ? 'mb-4' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Film className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-medium mb-2">Drag & Drop Videos Here</h4>
                <p className="text-sm text-gray-500 mb-4">Supports MP4, MOV, AVI, WebM, and MKV files</p>
                <input
                  id="video-upload"
                  type="file"
                  multiple
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button asChild>
                  <label htmlFor="video-upload" className="cursor-pointer">
                    Choose Videos
                  </label>
                </Button>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm truncate flex-1 font-medium">{file.name}</span>
                        <span className="text-sm text-gray-500 ml-2">{formatBytes(file.originalSize)}</span>
                      </div>
                      {file.status === "compressing" && (
                        <Progress value={file.progress} className="h-2" />
                      )}
                      {file.status === "failed" && (
                        <div className="flex items-center gap-2 text-red-600 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          {file.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t">
            <div className="w-full">
              {files.length > 0 && !isCompressing && (
                <Alert className="mb-3">
                  <AlertDescription className="text-sm">
                    Estimated output: ~{formatBytes(estimateCompressedSize(totalOriginalSize, useCustomBitrate ? customBitrate : selectedPreset.bitrate))} 
                    ({Math.round((1 - estimateCompressedSize(totalOriginalSize, useCustomBitrate ? customBitrate : selectedPreset.bitrate) / totalOriginalSize) * 100)}% reduction)
                  </AlertDescription>
                </Alert>
              )}
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleCompress}
                disabled={files.length === 0 || isCompressing}
              >
                {isCompressing ? "Compressing..." : "Compress Videos"}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Download className="h-5 w-5" />
              Results
            </h2>
          </CardHeader>
          <CardContent>
            {completedFiles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Film className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No compressed videos yet</p>
                <p className="text-sm mt-2">Upload and compress videos to see results here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-sm text-emerald-800">
                    Successfully compressed {completedFiles.length} video(s) with {totalReduction}% average reduction
                  </p>
                </div>

                {/* File Results */}
                <div className="space-y-2">
                  {completedFiles.map((file) => (
                    <div key={file.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{file.name.replace(/\.[^/.]+$/, `.${targetFormat}`)}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            {file.duration && <span>{formatDuration(file.duration)}</span>}
                            {file.resolution && <span>{file.resolution}</span>}
                            <span className="text-emerald-600">-{file.reduction}%</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadFile(file)}
                        >
                          Download
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatBytes(file.originalSize)} → {formatBytes(file.compressedSize || 0)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Download All Button */}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => completedFiles.forEach(downloadFile)}
                >
                  Download All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
