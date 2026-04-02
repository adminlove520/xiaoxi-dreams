'use client';

import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  species: string;
  status: string;
  last_heartbeat: string;
  memory_count: number;
  dream_count: number;
}

interface DashboardData {
  stats: {
    total_agents: number;
    online_agents: number;
    total_memories: number;
    total_dreams: number;
    avg_importance: number;
  };
  memoryByType: { type: string; count: number }[];
  agentsSummary: Agent[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentSpecies, setNewAgentSpecies] = useState('lobster');
  const [newApiKey, setNewApiKey] = useState('');
  const [newAgentToken, setNewAgentToken] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function registerAgent() {
    if (!newAgentName.trim()) return;
    setRegistering(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAgentName, species: newAgentSpecies })
      });
      const json = await res.json();
      if (json.success) {
        setNewApiKey(json.apiKey);
        setNewAgentToken(json.token);
        fetchDashboard();
      }
    } catch (error) {
      console.error('Failed to register agent:', error);
    } finally {
      setRegistering(false);
    }
  }

  function copyApiKey() {
    navigator.clipboard.writeText(newApiKey);
  }

  function copyToken() {
    navigator.clipboard.writeText(newAgentToken);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              <span className="text-cyan-400">Superdreams</span>
              <span className="text-purple-400">超梦 Control Center</span>
            </h1>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
              {data?.stats.online_agents || 0} Online
            </span>
          </div>
          <button
            onClick={() => setShowRegister(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition-colors"
          >
            + Register Agent
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            label="Total Agents" 
            value={data?.stats.total_agents || 0} 
            color="cyan"
          />
          <StatCard 
            label="Online" 
            value={data?.stats.online_agents || 0} 
            color="green"
          />
          <StatCard 
            label="Total Memories" 
            value={data?.stats.total_memories || 0} 
            color="purple"
          />
          <StatCard 
            label="Total Dreams" 
            value={data?.stats.total_dreams || 0} 
            color="pink"
          />
        </div>

        {/* Agents Grid */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Agents</h2>
          {data?.agentsSummary.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No agents registered yet. Click "Register Agent" to add one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.agentsSummary.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>

        {/* Memory Distribution */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Memory Distribution</h2>
          <div className="flex flex-wrap gap-2">
            {data?.memoryByType.map(({ type, count }) => (
              <span
                key={type}
                className="px-4 py-2 bg-gray-700 rounded-full text-sm"
              >
                {type}: {count}
              </span>
            ))}
            {(!data?.memoryByType || data.memoryByType.length === 0) && (
              <span className="text-gray-500">No memories yet</span>
            )}
          </div>
        </div>
      </main>

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            {!newApiKey ? (
              <>
                <h3 className="text-xl font-bold mb-4">Register New Agent</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      placeholder="e.g., Superdreams"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Species</label>
                    <select
                      value={newAgentSpecies}
                      onChange={(e) => setNewAgentSpecies(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="lobster">🦞 Lobster</option>
                      <option value="ai">🤖 AI Agent</option>
                      <option value="human">👤 Human</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowRegister(false)}
                      className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={registerAgent}
                      disabled={registering || !newAgentName.trim()}
                      className="flex-1 px-4 py-2 bg-cyan-500 rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                    >
                      {registering ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-4 text-green-400">Agent Created!</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">API Key (save this!)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newApiKey}
                        readOnly
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 font-mono text-sm"
                      />
                      <button
                        onClick={copyApiKey}
                        className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">JWT Token (alternate)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAgentToken}
                        readOnly
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 font-mono text-xs overflow-hidden text-ellipsis"
                      />
                      <button
                        onClick={copyToken}
                        className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-yellow-400 mt-2">
                      ⚠️ These credentials will only be shown once!
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { setShowRegister(false); setNewApiKey(''); setNewAgentToken(''); }}
                      className="flex-1 px-4 py-2 bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    green: 'text-green-400 bg-green-500/10 border-green-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  };
  
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const isOnline = agent.status === 'online';
  const lastSeen = agent.last_heartbeat 
    ? new Date(agent.last_heartbeat).toLocaleString()
    : 'Never';
  
  const speciesEmoji: Record<string, string> = {
    lobster: '🦞',
    ai: '🤖',
    human: '👤',
  };
  
  return (
    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{speciesEmoji[agent.species] || '🤖'}</span>
          <span className="font-bold">{agent.name}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      <div className="text-sm text-gray-400 space-y-1">
        <div>🧠 {agent.memory_count || 0} memories</div>
        <div>💭 {agent.dream_count || 0} dreams</div>
        <div>⏰ {lastSeen}</div>
      </div>
    </div>
  );
}
