'use client'

import { useState } from 'react'
import { Link, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export default function SyncSettings() {
  const [centerUrl, setCenterUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Load from localStorage on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      setCenterUrl(localStorage.getItem('centerUrl') || '')
      setApiKey(localStorage.getItem('apiKey') || '')
    }
  })

  async function handleSync() {
    if (!centerUrl || !apiKey) return
    
    setSyncing(true)
    setResult(null)
    
    localStorage.setItem('centerUrl', centerUrl)
    localStorage.setItem('apiKey', apiKey)

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centerUrl, apiKey })
      })
      const json = await res.json()
      
      if (json.success) {
        setResult({ success: true, message: `已同步 ${json.memories.sent} 条记忆` })
      } else {
        setResult({ success: false, message: json.error || '同步失败' })
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Link className="w-5 h-5 text-purple-400" />
        <h3 className="font-bold text-zinc-100">控制中心同步</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Center URL</label>
          <input 
            type="text" 
            value={centerUrl}
            onChange={(e) => setCenterUrl(e.target.value)}
            placeholder="http://127.0.0.1:3001"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">API Key</label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk_..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-purple-500"
          />
        </div>
        
        <button
          onClick={handleSync}
          disabled={syncing || !centerUrl || !apiKey}
          className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {syncing ? '同步中...' : '立即同步'}
        </button>

        {result && (
          <div className={`flex items-center gap-2 text-xs mt-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
            {result.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {result.message}
          </div>
        )}
      </div>
    </div>
  )
}
