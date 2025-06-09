"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, Film } from "lucide-react"
import ImageConverter from "./image-converter"
import VideoCompressor from "./video-compressor"

export default function MediaConverter() {
  const [activeTab, setActiveTab] = useState("image")

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Media Optimizer</h1>
        <p className="text-gray-600">Professional image and video compression for optimal web performance</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="image" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Image Converter
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            Video Compressor
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="image" className="mt-0">
          <ImageConverter />
        </TabsContent>
        
        <TabsContent value="video" className="mt-0">
          <VideoCompressor />
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Media Optimizer • Compress images and videos for the web</p>
      </div>
    </div>
  )
}