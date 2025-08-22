'use client'

import { useState, useEffect } from 'react'

interface SystemStats {
  totalFiles: number
  uniqueHashes: number
  duplicatesSaved: number
  processing: Record<string, number>
  timestamp: string
}

export function SystemStats() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stats')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setStats(data.stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Stats</h3>
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) return null

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'processing': return 'text-blue-600'
      case 'failed': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed': return '✅'
      case 'processing': return '🔄'
      case 'failed': return '❌'
      default: return '⏳'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">System Statistics</h3>
        <button
          onClick={fetchStats}
          className="text-sm text-blue-600 hover:text-blue-800"
          disabled={loading}
        >
          {loading ? '🔄' : '🔄'} Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalFiles}</div>
          <div className="text-sm text-gray-500">Total Files</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.uniqueHashes}</div>
          <div className="text-sm text-gray-500">Unique Files</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.duplicatesSaved}</div>
          <div className="text-sm text-gray-500">Duplicates Saved</div>
        </div>
      </div>

      {Object.keys(stats.processing).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Processing Status</h4>
          <div className="space-y-2">
            {Object.entries(stats.processing).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">{getStatusIcon(status)}</span>
                  <span className={`text-sm ${getStatusColor(status)} capitalize`}>
                    {status}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 border-t pt-3">
        Last updated: {new Date(stats.timestamp).toLocaleString()}
      </div>
    </div>
  )
}
