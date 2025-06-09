import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import sharp from 'sharp';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({
    multiples: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  try {
    const [fields, files] = await form.parse(req);
    const quality = parseInt(fields.quality?.[0] || '80');
    const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files];

    const results = [];

    for (const file of uploadedFiles) {
      if (!file || !file.filepath) continue;

      const buffer = await fs.readFile(file.filepath);
      const webpBuffer = await sharp(buffer)
        .webp({ quality })
        .toBuffer();

      const originalSize = file.size || buffer.length;
      const convertedSize = webpBuffer.length;
      const fileName = file.originalFilename || 'image';
      const webpFileName = fileName.replace(/\.[^/.]+$/, '.webp');

      results.push({
        originalName: fileName,
        originalSize,
        webpName: webpFileName,
        webpSize: convertedSize,
        webpData: webpBuffer.toString('base64'),
      });

      // Clean up temp file
      await fs.unlink(file.filepath);
    }

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Failed to convert images' });
  }
}