"use client";

import {
  useState,
  useCallback,
  DragEvent,
  ChangeEvent,
  useEffect,
} from "react";

interface FileUploadResult {
  success: boolean;
  duplicate: boolean;
  message: string;
  file: {
    id: string;
    name: string;
    hash: string;
    size: number;
    mimeType: string;
    createdAt: string;
    processingStatus: string;
    chunkCount?: number;
  };
}

interface FileUploadError {
  error: string;
  message?: string;
}

export function FileUploadZone() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<FileUploadResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const fetchFiles = async () => {
    const response = await fetch("/api/files", {
      method: "GET",
    });
    const data = await response.json();
    setResults(data.files || []);
  };

  useEffect(() => {
    try {
        fetchFiles();
    } catch (error) {}
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  }, []);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
    }
  }, []);

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setErrors([]);
    const newResults: FileUploadResult[] = [];
    const newErrors: string[] = [];

    for (const file of files) {
      try {
        console.log(`📤 Uploading: ${file.name} (${file.size} bytes)`);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}`);
        }

        newResults.push(result);
        console.log(`✅ Upload result for ${file.name}:`, result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`❌ Upload failed for ${file.name}:`, errorMessage);
        newErrors.push(`${file.name}: ${errorMessage}`);
      }
    }

    setResults((prev) => [...newResults, ...prev]);
    setErrors(newErrors);
    setUploading(false);
  };

  const formatFileSize = (bytes: number): string => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "processing":
        return "text-blue-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case "completed":
        return "✅";
      case "processing":
        return "🔄";
      case "failed":
        return "❌";
      default:
        return "⏳";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : uploading
            ? "border-gray-300 bg-gray-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Uploading files...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here to upload
            </p>
            <p className="text-gray-500 mb-4">
              Or click to browse and select files
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              accept="*/*"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              Select Files
            </label>
          </>
        )}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Upload Errors:</h3>
          <ul className="text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Upload Results</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  result.duplicate
                    ? "border-orange-200 bg-orange-50"
                    : "border-green-200 bg-green-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">
                        {result.duplicate ? "🔄" : "📄"}
                      </span>
                      <h3 className="font-medium text-gray-900">
                        {result.file.name}
                      </h3>
                      <span
                        className={`ml-2 text-sm ${getStatusColor(
                          result.file.processingStatus
                        )}`}
                      >
                        {getStatusIcon(result.file.processingStatus)}{" "}
                        {result.file.processingStatus}
                      </span>
                    </div>
                    <p
                      className={`text-sm mb-2 ${
                        result.duplicate ? "text-orange-700" : "text-green-700"
                      }`}
                    >
                      {result.message}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Size:</span>{" "}
                        {formatFileSize(result.file.size)}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span>{" "}
                        {result.file.mimeType}
                      </div>
                      <div>
                        <span className="font-medium">ID:</span>
                        <code className="ml-1 text-xs bg-gray-100 px-1 rounded">
                          {result.file.id.slice(0, 8)}...
                        </code>
                      </div>
                      {result.file.chunkCount && (
                        <div>
                          <span className="font-medium">Chunks:</span>{" "}
                          {result.file.chunkCount}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Hash:</span>
                      <code className="ml-1 bg-gray-100 px-1 rounded break-all">
                        {result.file.hash}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Information */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-4 rounded-lg">
            <code className="font-mono text-blue-600">POST /api/upload</code>
            <p className="mt-1 text-gray-600">
              Upload files and check for duplicates
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <code className="font-mono text-blue-600">
              GET /api/check-duplicate/[hash]
            </code>
            <p className="mt-1 text-gray-600">Check if a hash already exists</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <code className="font-mono text-blue-600">GET /api/files</code>
            <p className="mt-1 text-gray-600">List all uploaded files</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <code className="font-mono text-blue-600">GET /api/stats</code>
            <p className="mt-1 text-gray-600">Get system statistics</p>
          </div>
        </div>
      </div>
    </div>
  );
}
