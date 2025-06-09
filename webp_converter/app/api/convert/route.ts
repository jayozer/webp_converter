import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const quality = parseInt(formData.get('quality') as string) || 80
    const lossless = formData.get('lossless') === 'true'
    const preserveMetadata = formData.get('preserveMetadata') === 'true'
    const preserveTransparency = formData.get('preserveTransparency') === 'true'
    const autoResize = formData.get('autoResize') === 'true'
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const buffer = Buffer.from(await file.arrayBuffer())
          
          let sharpInstance = sharp(buffer)
          
          // Get metadata
          const metadata = await sharpInstance.metadata()
          
          // Auto-resize if enabled and image is large
          if (autoResize && metadata.width && metadata.height) {
            const maxDimension = 2048
            if (metadata.width > maxDimension || metadata.height > maxDimension) {
              sharpInstance = sharpInstance.resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true
              })
            }
          }

          // Configure WebP options
          const webpOptions: sharp.WebpOptions = {
            quality: lossless ? 100 : quality,
            lossless,
            alphaQuality: preserveTransparency ? 100 : undefined,
            effort: 6,
          }

          // Convert to WebP
          let webpBuffer = await sharpInstance
            .webp(webpOptions)
            .toBuffer({ resolveWithObject: true })

          // Handle metadata
          if (!preserveMetadata && webpBuffer.info.size) {
            // Remove metadata by re-encoding without it
            webpBuffer = await sharp(webpBuffer.data)
              .webp(webpOptions)
              .toBuffer({ resolveWithObject: true })
          }

          return {
            originalName: file.name,
            originalSize: file.size,
            webpName: file.name.replace(/\.[^/.]+$/, '.webp'),
            webpSize: webpBuffer.info.size,
            webpData: webpBuffer.data.toString('base64'),
          }
        } catch (error) {
          console.error(`Error converting ${file.name}:`, error)
          return null
        }
      })
    )

    const validResults = results.filter(r => r !== null)

    return NextResponse.json({
      success: true,
      results: validResults,
    })
  } catch (error) {
    console.error('Conversion error:', error)
    return NextResponse.json(
      { error: 'Failed to convert images' },
      { status: 500 }
    )
  }
}