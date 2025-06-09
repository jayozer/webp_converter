# WebP Converter - Next.js Version

A modern, fast web application for converting images to WebP format, built with Next.js and optimized for Vercel deployment.

## Features

- Convert PNG, JPG, and JPEG images to WebP format
- Batch conversion support
- Adjustable quality settings (0-100)
- Real-time file size comparison
- Download individual files or all at once
- Professional UI with Tailwind CSS
- Server-side image processing with Sharp

## Tech Stack

- Next.js 14 with TypeScript
- React 18
- Tailwind CSS for styling
- Sharp for image processing
- Formidable for file uploads
- Vercel-ready deployment

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, or pnpm package manager

### Installation

1. Navigate to the project directory:
```bash
cd nextjs-webp-converter
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import your project to Vercel:
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Vercel will automatically detect Next.js and configure the build settings

3. Click "Deploy" and your app will be live in minutes!

### Environment Variables

No environment variables are required for basic functionality.

## API Endpoints

### POST /api/convert

Converts uploaded images to WebP format.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `files`: Image files (PNG, JPG, JPEG)
  - `quality`: Quality setting (0-100)

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "originalName": "image.png",
      "originalSize": 123456,
      "webpName": "image.webp",
      "webpSize": 45678,
      "webpData": "base64_encoded_data..."
    }
  ]
}
```

## Project Structure

```
nextjs-webp-converter/
├── pages/
│   ├── api/
│   │   └── convert.ts    # API endpoint for image conversion
│   ├── _app.tsx          # Next.js app component
│   └── index.tsx         # Main page component
├── styles/
│   └── globals.css       # Global styles and Tailwind imports
├── public/               # Static assets
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── vercel.json          # Vercel deployment configuration
```

## License

MIT