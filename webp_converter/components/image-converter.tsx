"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Upload, Download, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface FileItem {
  id: string
  file: File
  name: string
  originalSize: number
  webpSize?: number
  webpBlob?: Blob
  reduction?: number
  status: "pending" | "converting" | "completed" | "failed"
  error?: string
}

export default function ImageConverter() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [quality, setQuality] = useState(80)
  const [isConverting, setIsConverting] = useState(false)
  const [losslessConversion, setLosslessConversion] = useState(false)
  const [preserveTransparency, setPreserveTransparency] = useState(true)
  const [preserveMetadata, setPreserveMetadata] = useState(true)
  const [autoResize, setAutoResize] = useState(false)
  const [dragActive, setDragActive] = useState(false)

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
      .filter(file => file.type.startsWith('image/'))
      .map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        originalSize: file.size,
        status: "pending" as const,
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

  const handleConvert = async () => {
    if (files.length === 0) return
    setIsConverting(true)

    const formData = new FormData()
    formData.append('quality', quality.toString())
    formData.append('lossless', losslessConversion.toString())
    formData.append('preserveMetadata', preserveMetadata.toString())
    formData.append('preserveTransparency', preserveTransparency.toString())
    formData.append('autoResize', autoResize.toString())

    files.forEach(fileItem => {
      formData.append('files', fileItem.file)
    })

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Conversion failed')
      }

      const data = await response.json()
      
      const updatedFiles = files.map((file, index) => {
        const result = data.results[index]
        if (result) {
          return {
            ...file,
            webpSize: result.webpSize,
            webpBlob: new Blob([Uint8Array.from(atob(result.webpData), c => c.charCodeAt(0))], { type: 'image/webp' }),
            reduction: Math.round(((file.originalSize - result.webpSize) / file.originalSize) * 100),
            status: "completed" as const,
          }
        }
        return { ...file, status: "failed" as const, error: "Conversion failed" }
      })

      setFiles(updatedFiles)
    } catch (error) {
      console.error('Conversion error:', error)
      setFiles(files.map(f => ({ ...f, status: "failed" as const, error: "Conversion failed" })))
    } finally {
      setIsConverting(false)
    }
  }

  const downloadFile = (fileItem: FileItem) => {
    if (!fileItem.webpBlob) return
    
    const url = URL.createObjectURL(fileItem.webpBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileItem.name.replace(/\.[^/.]+$/, '.webp')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAll = () => {
    files.forEach(file => {
      if (file.status === 'completed') {
        downloadFile(file)
      }
    })
  }

  const completedFiles = files.filter(f => f.status === 'completed')
  const totalOriginalSize = files.reduce((acc, file) => acc + file.originalSize, 0)
  const totalWebpSize = files.reduce((acc, file) => acc + (file.webpSize || 0), 0)
  const totalReduction = totalOriginalSize > 0 ? Math.round(((totalOriginalSize - totalWebpSize) / totalOriginalSize) * 100) : 0

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Convert Section */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload & Convert
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quality Setting */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="quality" className="text-base font-medium flex items-center gap-2">
                  Quality Setting
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Adjust the compression quality from 0-100. Lower values create smaller files with reduced quality, while higher values preserve more detail but result in larger files. Disabled when using lossless compression.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <span className="text-2xl font-bold">{quality}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Small</span>
                <Slider
                  id="quality"
                  min={0}
                  max={100}
                  step={1}
                  value={[quality]}
                  onValueChange={(value) => setQuality(value[0])}
                  className="flex-1"
                  disabled={losslessConversion}
                />
                <span className="text-sm text-gray-500">Best</span>
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <h3 className="text-base font-medium mb-4">Advanced Options</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lossless" className="font-normal cursor-pointer flex items-center gap-2">
                    Lossless Conversion
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Compresses images without any quality loss. File sizes will be larger than lossy compression, but the image will be pixel-perfect to the original. Ideal for graphics, logos, and images requiring exact reproduction.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Switch
                    id="lossless"
                    checked={losslessConversion}
                    onCheckedChange={setLosslessConversion}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="transparency" className="font-normal cursor-pointer flex items-center gap-2">
                    Preserve Transparency
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Maintains transparent areas (alpha channel) from PNG and other formats. Essential for logos, icons, and images with transparent backgrounds. Disabling this will replace transparency with a solid background.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Switch
                    id="transparency"
                    checked={preserveTransparency}
                    onCheckedChange={setPreserveTransparency}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="metadata" className="font-normal cursor-pointer flex items-center gap-2">
                    Preserve Metadata
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Keeps EXIF data, color profiles, and other metadata from the original image. This includes camera settings, location data, copyright info, etc. Disable to remove all metadata for smaller files and privacy.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Switch
                    id="metadata"
                    checked={preserveMetadata}
                    onCheckedChange={setPreserveMetadata}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="resize" className="font-normal cursor-pointer flex items-center gap-2">
                    Auto-resize Large Images
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Automatically scales down images larger than 2048x2048 pixels to reduce file size while maintaining aspect ratio. Useful for optimizing high-resolution photos for web use without manual resizing.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Switch
                    id="resize"
                    checked={autoResize}
                    onCheckedChange={setAutoResize}
                  />
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div>
              <h3 className="text-base font-medium mb-3">Select Images</h3>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}
                  ${files.length > 0 ? 'mb-4' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-medium mb-2">Drag & Drop Files Here</h4>
                <p className="text-sm text-gray-500 mb-4">Supports JPG, PNG, GIF, TIFF, and BMP files</p>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose Files
                  </label>
                </Button>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{formatBytes(file.originalSize)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t">
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                WebP can reduce file sizes by up to 80%
              </p>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleConvert}
                disabled={files.length === 0 || isConverting}
              >
                {isConverting ? "Converting..." : "Convert Images"}
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
                <p>No converted images yet</p>
                <p className="text-sm mt-2">Upload and convert images to see results here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-sm text-emerald-800">
                    Successfully converted {completedFiles.length} image(s) with {totalReduction}% average reduction
                  </p>
                </div>

                {/* File Results */}
                <div className="space-y-2">
                  {completedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{file.name.replace(/\.[^/.]+$/, '.webp')}</p>
                        <p className="text-xs text-gray-500">
                          {formatBytes(file.originalSize)} → {formatBytes(file.webpSize || 0)} 
                          <span className="text-emerald-600 ml-1">(-{file.reduction}%)</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadFile(file)}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Download All Button */}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={downloadAll}
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