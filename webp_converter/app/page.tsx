import type { Metadata } from "next"
import MediaConverter from "@/components/media-converter"

export const metadata: Metadata = {
  title: "Media Optimizer | Professional Image & Video Compression",
  description: "Convert images to WebP and compress videos for optimal web performance",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-8">
      <MediaConverter />
    </main>
  )
}
