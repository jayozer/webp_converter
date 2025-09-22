# Media Optimizer - Architecture Flow Diagram

## System Overview

```mermaid
graph TB
    subgraph "Client Browser"
        UI[User Interface<br/>React Components]
        WASM[FFmpeg.wasm<br/>Video Processing]
    end

    subgraph "Next.js Server"
        API[API Routes]
        SHARP[Sharp<br/>Image Processing]
    end

    UI -->|Image Files| API
    API --> SHARP
    SHARP -->|WebP Data| API
    API -->|Base64 Response| UI

    UI -->|Video Files| WASM
    WASM -->|Compressed Video| UI
```

## Image Conversion Flow (Server-Side)

```mermaid
sequenceDiagram
    participant User
    participant UI as MediaConverter<br/>Component
    participant IC as ImageConverter<br/>Component
    participant API as /api/convert<br/>(Server)
    participant Sharp as Sharp Library

    User->>UI: Opens App
    UI->>IC: Selects Image Tab
    User->>IC: Drops/Selects Images
    IC->>IC: Validates Files<br/>(PNG/JPG/GIF/BMP/TIFF)

    User->>IC: Configures Options<br/>(Quality, Lossless, Metadata)
    User->>IC: Clicks Convert

    IC->>API: POST FormData<br/>(files + options)

    loop For Each Image
        API->>Sharp: Create Instance<br/>from Buffer
        Sharp->>Sharp: Get Metadata

        alt Auto-Resize Enabled & Image > 2048px
            Sharp->>Sharp: Resize to 2048px max
        end

        Sharp->>Sharp: Convert to WebP<br/>(with options)

        alt Remove Metadata
            Sharp->>Sharp: Re-encode without metadata
        end

        Sharp-->>API: WebP Buffer
    end

    API-->>IC: JSON Response<br/>(base64 encoded images)
    IC->>IC: Display Results<br/>(Size comparison)
    IC->>User: Download Links
```

## Video Compression Flow (Client-Side)

```mermaid
sequenceDiagram
    participant User
    participant UI as MediaConverter<br/>Component
    participant VC as VideoCompressor<br/>Component
    participant FFmpeg as FFmpeg.wasm<br/>(Browser)
    participant Memory as Browser Memory

    User->>UI: Opens App
    UI->>VC: Selects Video Tab

    VC->>FFmpeg: Load FFmpeg.wasm
    FFmpeg->>Memory: Initialize WASM Module
    FFmpeg-->>VC: Ready State

    User->>VC: Drops/Selects Video
    VC->>VC: Validates File<br/>(MP4/MOV/AVI/WebM/MKV)

    User->>VC: Configures Options
    Note over VC: - Output Format<br/>- Bitrate/Quality<br/>- Resolution<br/>- Audio Settings

    User->>VC: Clicks Compress

    VC->>Memory: Load Video to Memory
    VC->>FFmpeg: writeFile('input.mp4')

    VC->>FFmpeg: Build FFmpeg Command
    Note over FFmpeg: ffmpeg -i input.mp4<br/>-c:v libx264<br/>-b:v [bitrate]<br/>-preset fast<br/>output.mp4

    FFmpeg->>FFmpeg: Process Video
    FFmpeg-->>VC: Progress Updates
    VC->>User: Show Progress Bar

    FFmpeg->>Memory: Write Output
    FFmpeg-->>VC: Compressed Video Data

    VC->>VC: Create Blob URL
    VC->>User: Display Results<br/>(Size comparison)
    VC->>User: Download Link
```

## Component Architecture

```mermaid
graph TD
    subgraph "Page Structure"
        Layout[app/layout.tsx<br/>Root Layout]
        Page[app/page.tsx<br/>Home Page]
        Layout --> Page
    end

    subgraph "Main Components"
        Page --> MC[MediaConverter<br/>Tabbed Interface]
        MC --> Tabs{Tabs Component}
        Tabs --> IC[ImageConverter]
        Tabs --> VC[VideoCompressor]
    end

    subgraph "Image Converter Features"
        IC --> IU[File Upload<br/>Drag & Drop]
        IC --> IS[Settings Panel<br/>Quality/Options]
        IC --> IR[Results Table<br/>Size Comparison]
    end

    subgraph "Video Compressor Features"
        VC --> VU[File Upload<br/>Drag & Drop]
        VC --> VS[Settings Panel<br/>Format/Bitrate]
        VC --> VP[Progress Bar]
        VC --> VR[Results Display]
    end

    subgraph "Shared UI Components"
        IC --> UI1[Button]
        IC --> UI2[Card]
        IC --> UI3[Slider]
        IC --> UI4[Switch]
        IC --> UI5[Table]
        VC --> UI1
        VC --> UI2
        VC --> UI3
        VC --> UI6[Progress]
        VC --> UI7[DropdownMenu]
    end
```

## Data Flow

```mermaid
flowchart LR
    subgraph "Image Processing"
        IF[Image Files] --> FD1[FormData]
        FD1 --> |HTTP POST| Server[Next.js Server]
        Server --> Sharp[Sharp Processing]
        Sharp --> B64I[Base64 WebP]
        B64I --> |JSON Response| Browser1[Browser]
        Browser1 --> Download1[Download WebP]
    end

    subgraph "Video Processing"
        VF[Video Files] --> FM[File to Memory]
        FM --> WASM[FFmpeg.wasm]
        WASM --> |In-Browser| Compressed[Compressed Video]
        Compressed --> Blob[Blob URL]
        Blob --> Download2[Download Video]
    end
```

## Key Technical Components

### Headers Configuration (next.config.ts)
```
COOP: same-origin
COEP: require-corp
```
Required for SharedArrayBuffer support in FFmpeg.wasm

### Webpack Polyfills
- `process` → 'process/browser'
- `Buffer` → ['buffer', 'Buffer']
- `node:` imports → browser equivalents

### File Size Limits
- Images: Handled by Sharp (server memory dependent)
- Videos: Limited by browser memory (typically 2GB max)

### Performance Characteristics
- **Image Conversion**: ~100-500ms per image (server-side)
- **Video Compression**: 1-10 minutes depending on size/settings (client-side)
- **Batch Processing**: Parallel for images, sequential for videos