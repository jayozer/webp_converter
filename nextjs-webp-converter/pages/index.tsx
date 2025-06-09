import { useState } from 'react';
import Head from 'next/head';

interface ConversionResult {
  originalName: string;
  originalSize: number;
  webpName: string;
  webpSize: number;
  webpData: string;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(80);
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState<ConversionResult[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setResults([]);
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setConverting(true);
    const formData = new FormData();
    formData.append('quality', quality.toString());
    
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      setConverting(false);
    }
  };

  const downloadFile = (result: ConversionResult) => {
    const link = document.createElement('a');
    link.href = `data:image/webp;base64,${result.webpData}`;
    link.download = result.webpName;
    link.click();
  };

  const downloadAll = () => {
    results.forEach(result => downloadFile(result));
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalWebpSize = results.reduce((sum, r) => sum + r.webpSize, 0);
  const savings = totalOriginalSize > 0 ? ((1 - totalWebpSize / totalOriginalSize) * 100).toFixed(1) : 0;

  return (
    <>
      <Head>
        <title>WebP Converter - Fast & Free Image Conversion</title>
        <meta name="description" content="Convert PNG, JPG, and JPEG images to WebP format instantly" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Instant WebP Converter
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Convert your images to WebP format for faster web performance
            </p>
            <p className="text-lg text-gray-500">
              Upload multiple files and download converted ones with a single click
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                Why WebP?
              </h2>
              <p className="text-gray-600">
                WebP is a modern image format that provides superior lossless and lossy compression 
                for images on the web. Using WebP, you can create smaller, richer images that make 
                the web faster while maintaining excellent visual quality.
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Setting
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-lg font-medium text-gray-700 w-12 text-center">
                  {quality}
                </span>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Images
              </label>
              <input
                type="file"
                multiple
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
            </div>

            {files.length > 0 && (
              <div className="mb-8">
                <button
                  onClick={handleConvert}
                  disabled={converting}
                  className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg
                    hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
                >
                  {converting ? 'Converting...' : `Convert ${files.length} Image${files.length > 1 ? 's' : ''}`}
                </button>
              </div>
            )}

            {results.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Conversion Results
                  </h3>
                  <button
                    onClick={downloadAll}
                    className="bg-green-600 text-white font-medium py-2 px-4 rounded-lg
                      hover:bg-green-700 transition duration-200"
                  >
                    Download All
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Original File
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Original Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          WebP Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reduction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((result, index) => {
                        const reduction = ((1 - result.webpSize / result.originalSize) * 100).toFixed(1);
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {result.originalName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatFileSize(result.originalSize)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatFileSize(result.webpSize)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-medium ${Number(reduction) > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                {reduction}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => downloadFile(result)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Download
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          Total
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatFileSize(totalOriginalSize)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatFileSize(totalWebpSize)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                          <span className="text-green-600">{savings}%</span>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}