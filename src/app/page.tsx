import { FileUploadZone } from '@/components/FileUploadZone'
import { SystemStats } from '@/components/SystemStats'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            File De-duplication System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload files to detect duplicates using SHA-256 hashing. 
            Duplicate files are instantly identified without reprocessing, 
            saving time and resources in your RAG pipeline.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg">
              <FileUploadZone />
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <SystemStats />
          </div>
        </div>
      </div>
    </main>
  )
}
