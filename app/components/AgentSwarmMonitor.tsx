'use client';

/**
 * Agent Swarm Monitoring Dashboard - Standalone Component
 * Real-time monitoring of agent swarm projects with status, agents, logs, and metrics
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Download,
  Eye,
  TrendingUp,
  Zap,
  Server,
  Database,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AIKitButton } from '@/components/aikit/AIKitButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authService } from '@/services/authService';
import LoginForm from './LoginForm';
import { LogOut } from 'lucide-react';

// Types
interface ProjectStatus {
  project_id: string;
  status: string;
  progress: number;
  message: string;
  created_at?: string;
}

interface Agent {
  agent_name: string;
  status: string;
  progress: number;
  current_task: string;
  model: string;
  start_time?: string | null;
  completion_time?: string | null;
  tokens_used?: number;
  cost_usd?: number;
}

interface LogEntry {
  timestamp: string;
  level: string;
  agent?: string;
  message: string;
}

interface Project {
  project_id: string;
  project_name: string;
  project_type: string;
  status: string;
  created_at: string;
}

// Agent Status Card Component
const AgentCard = ({ agent }: { agent: Agent }) => {
  const getStatusIcon = () => {
    switch (agent.status) {
      case 'running':
      case 'active':
        return <Loader2 className="w-5 h-5 animate-spin text-[#4B6FED]" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (agent.status) {
      case 'running':
      case 'active':
        return 'from-[#4B6FED]/20 to-[#8A63F4]/20 border-[#4B6FED]/40';
      case 'completed':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/40';
      case 'failed':
        return 'from-red-500/20 to-rose-500/20 border-red-500/40';
      default:
        return 'from-gray-700/20 to-gray-600/20 border-gray-700/40';
    }
  };

  return (
    <Card className={`bg-gradient-to-br ${getStatusColor()} border transition-all hover:scale-105`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <h3 className="font-semibold text-white capitalize">
              {agent.agent_name.replace('_', ' ')}
            </h3>
          </div>
          <Badge
            variant={agent.status === 'completed' ? 'default' : 'outline'}
            className="capitalize"
          >
            {agent.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-300 mb-3">{agent.current_task}</p>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span>{agent.progress}%</span>
          </div>
          <Progress value={agent.progress} className="h-2" />
          <div className="flex items-center justify-between text-xs mt-2">
            <div className="text-gray-500 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {agent.model.split('/').pop() || agent.model}
            </div>
            {agent.tokens_used && (
              <div className="text-[#4B6FED] font-medium">
                {agent.tokens_used.toLocaleString()} tokens
              </div>
            )}
          </div>
          {agent.cost_usd && (
            <div className="text-xs text-green-400 text-right">
              ${agent.cost_usd.toFixed(4)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Log Entry Component
const LogEntryComponent = ({ log }: { log: LogEntry }) => {
  const getLevelColor = () => {
    switch (log.level.toLowerCase()) {
      case 'error':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'info':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getLevelColor()} font-mono text-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs opacity-60">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {log.agent && (
              <Badge variant="outline" className="text-xs">
                {log.agent}
              </Badge>
            )}
            <Badge className={`text-xs uppercase ${getLevelColor()}`}>{log.level}</Badge>
          </div>
          <p className="text-gray-200">{log.message}</p>
        </div>
      </div>
    </div>
  );
};

// Main Monitoring Component
export default function AgentSwarmMonitorClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [openClawStatus, setOpenClawStatus] = useState<{
    connected: boolean;
    active_commands: number;
    last_ping?: string;
  } | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setAuthChecked(true);

      if (authenticated) {
        loadProjects();
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    loadProjects();
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setProjects([]);
    setSelectedProjectId('');
    setProjectStatus(null);
    setAgents([]);
    setLogs([]);
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData();
    }
  }, [selectedProjectId]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!autoRefresh || !selectedProjectId || !isAuthenticated) {
      // Clean up existing WebSocket if conditions not met
      if (ws) {
        ws.close();
        setWs(null);
        setWsConnected(false);
      }
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    const token = authService.getToken();

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // Create WebSocket connection
    const websocket = new WebSocket(`${wsUrl}/admin/agent-swarm/projects/${selectedProjectId}/ws?token=${token}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different message types
        if (data.type === 'status_update') {
          setProjectStatus(data.status);
        } else if (data.type === 'agent_update') {
          setAgents(data.agents);
        } else if (data.type === 'log_entry') {
          setLogs(prev => [...prev, data.log].slice(-100)); // Keep last 100 logs
        } else if (data.type === 'full_update') {
          // Full data refresh
          if (data.status) setProjectStatus(data.status);
          if (data.agents) setAgents(data.agents);
          if (data.logs) setLogs(data.logs.slice(-100));
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);

      // Attempt reconnection after 3 seconds if still needed
      if (autoRefresh && selectedProjectId && isAuthenticated) {
        setTimeout(() => {
          loadProjectData(); // Fallback to REST API
        }, 3000);
      }
    };

    setWs(websocket);

    // Cleanup on unmount or dependency change
    return () => {
      websocket.close();
    };
  }, [autoRefresh, selectedProjectId, isAuthenticated]);

  const loadProjects = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/admin/agent-swarm/projects?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          await authService.logout();
          return;
        }
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);

      // Auto-select first project if no project selected
      if (!selectedProjectId && data.projects?.length > 0) {
        setSelectedProjectId(data.projects[0].project_id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async () => {
    if (!selectedProjectId) return;

    const token = authService.getToken();
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

    try {
      // Load status
      const statusResponse = await fetch(
        `${apiUrl}/admin/agent-swarm/projects/${selectedProjectId}/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!statusResponse.ok && statusResponse.status === 401) {
        setIsAuthenticated(false);
        await authService.logout();
        return;
      }

      const statusData = await statusResponse.json();
      setProjectStatus(statusData);

      // Load agents
      const agentsResponse = await fetch(
        `${apiUrl}/admin/agent-swarm/projects/${selectedProjectId}/agents`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const agentsData = await agentsResponse.json();
      setAgents(Array.isArray(agentsData) ? agentsData : []);

      // Load logs
      const logsResponse = await fetch(
        `${apiUrl}/admin/agent-swarm/projects/${selectedProjectId}/logs?limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const logsData = await logsResponse.json();
      setLogs(Array.isArray(logsData) ? logsData : []);

      // Load OpenClaw status
      try {
        const openclawResponse = await fetch(
          `${apiUrl}/api/v1/openclaw/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (openclawResponse.ok) {
          const openclawData = await openclawResponse.json();
          setOpenClawStatus(openclawData);
        }
      } catch (error) {
        console.log('OpenClaw status not available');
        setOpenClawStatus({ connected: false, active_commands: 0 });
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    }
  };

  // Show login form if not authenticated
  if (authChecked && !isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#4B6FED]" />
        <span className="ml-3 text-lg">Loading Monitor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#4B6FED] to-[#8A63F4] bg-clip-text text-transparent">
              Agent Swarm Monitor
            </h1>
            <p className="text-gray-400">Real-time monitoring of AI agent swarms</p>
          </div>
          <div className="flex items-center gap-3">
            <AIKitButton
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </AIKitButton>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[300px] bg-[#161B22] border-gray-700">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.project_id} value={project.project_id}>
                    {project.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AIKitButton
              variant={autoRefresh ? 'default' : 'outline'}
              size="icon"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </AIKitButton>
            <AIKitButton variant="outline" size="icon" onClick={loadProjectData}>
              <RotateCcw className="w-4 h-4" />
            </AIKitButton>
            {wsConnected && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                Live
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Status Overview */}
      {projectStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-[#4B6FED]/20 to-[#8A63F4]/20 border-[#4B6FED]/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <p className="text-2xl font-bold capitalize">{projectStatus.status}</p>
                  </div>
                  <Activity className="w-10 h-10 text-[#4B6FED]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Progress</p>
                    <p className="text-2xl font-bold">{projectStatus.progress}%</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Agents</p>
                    <p className="text-2xl font-bold">{agents.length}</p>
                  </div>
                  <Server className="w-10 h-10 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Logs</p>
                    <p className="text-2xl font-bold">{logs.length}</p>
                  </div>
                  <Database className="w-10 h-10 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border-violet-500/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Tokens</p>
                    <p className="text-2xl font-bold">
                      {agents.reduce((sum, agent) => sum + (agent.tokens_used || 0), 0).toLocaleString()}
                    </p>
                    {agents.some(a => a.cost_usd) && (
                      <p className="text-xs text-green-400 mt-1">
                        ${agents.reduce((sum, agent) => sum + (agent.cost_usd || 0), 0).toFixed(4)}
                      </p>
                    )}
                  </div>
                  <TrendingUp className="w-10 h-10 text-violet-400" />
                </div>
              </CardContent>
            </Card>

            {openClawStatus && (
              <Card className={`bg-gradient-to-br ${
                openClawStatus.connected
                  ? 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40'
                  : 'from-gray-500/20 to-slate-500/20 border-gray-500/40'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">OpenClaw</p>
                      <p className="text-sm font-semibold">
                        {openClawStatus.connected ? 'Connected' : 'Disconnected'}
                      </p>
                      {openClawStatus.connected && (
                        <p className="text-xs text-gray-500 mt-1">
                          {openClawStatus.active_commands} active
                        </p>
                      )}
                    </div>
                    <Zap className={`w-10 h-10 ${
                      openClawStatus.connected ? 'text-cyan-400' : 'text-gray-500'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#161B22] mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agents ({agents.length})</TabsTrigger>
            <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-[#161B22] border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#4B6FED]" />
                  Project Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectStatus && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Overall Progress</span>
                        <span className="text-sm font-medium">{projectStatus.progress}%</span>
                      </div>
                      <Progress value={projectStatus.progress} className="h-3" />
                    </div>
                    <div className="p-4 bg-[#0D1117] rounded-lg border border-gray-800">
                      <p className="text-sm text-gray-300">{projectStatus.message}</p>
                    </div>
                    {projectStatus.created_at && (
                      <p className="text-xs text-gray-500">
                        Created: {new Date(projectStatus.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent, index) => (
                <AgentCard key={index} agent={agent} />
              ))}
            </div>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent, index) => (
                <AgentCard key={index} agent={agent} />
              ))}
            </div>
            {agents.length === 0 && (
              <Card className="bg-[#161B22] border-gray-700">
                <CardContent className="py-12 text-center">
                  <Server className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No agents data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Execution Logs</h3>
              <AIKitButton variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </AIKitButton>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log, index) => (
                <LogEntryComponent key={index} log={log} />
              ))}
            </div>
            {logs.length === 0 && (
              <Card className="bg-[#161B22] border-gray-700">
                <CardContent className="py-12 text-center">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No logs available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
