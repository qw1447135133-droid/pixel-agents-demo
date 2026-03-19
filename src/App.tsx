import { useState } from 'react'
import { PixelOffice } from './components/PixelOffice'
import CoreModulesTest from './CoreModulesTest'
import TaskQueueTest from './TaskQueueTest'
import Dashboard from './pages/Dashboard'
import Plugins from './pages/Plugins'
import Settings from './pages/Settings'
import Logs from './pages/Logs'
import './App.css'

type ViewMode = 'office' | 'employees' | 'tasks' | 'core-modules' | 'task-queue' | 'settings'

// Mock window.openclaw for browser development
if (typeof window !== 'undefined' && !window.openclaw) {
  console.log('[Mock] Setting up mock window.openclaw for browser development');
  
  let gatewayStatus = {
    running: false,
    port: null,
    pid: null,
    uptime: null,
    startTime: null,
  };

  const mockPlugins = [
    { id: 'weather', type: 'skill' as const, name: '天气查询', version: '1.0.0', description: '查询天气', enabled: true, source: 'builtin' as const },
    { id: 'github', type: 'skill' as const, name: 'GitHub 集成', version: '1.0.0', description: 'GitHub 集成', enabled: true, source: 'builtin' as const },
    { id: 'openai', type: 'extension' as const, name: 'OpenAI GPT', version: '1.0.0', description: 'OpenAI GPT', enabled: true, source: 'builtin' as const },
    { id: 'anthropic', type: 'extension' as const, name: 'Claude', version: '1.0.0', description: 'Anthropic Claude', enabled: false, source: 'builtin' as const },
  ];

  const mockLogs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
  }> = [
    { timestamp: new Date(Date.now() - 60000), level: 'info', message: '系统启动' },
    { timestamp: new Date(Date.now() - 30000), level: 'info', message: 'Gateway 初始化完成' },
    { timestamp: new Date(Date.now() - 10000), level: 'warn', message: '检测到配置更新' },
  ];

  const statusListeners: Array<(status: unknown) => void> = [];
  const logListeners: Array<(log: { timestamp: Date; level: string; message: string }) => void> = [];

  (window as any).openclaw = {
    gateway: {
      start: async () => {
        console.log('[Mock] Starting gateway...');
        gatewayStatus = {
          running: true,
          port: 9787,
          pid: 12345,
          uptime: 0,
          startTime: new Date(),
        };
        statusListeners.forEach(cb => cb(gatewayStatus));
        return { success: true };
      },
      stop: async () => {
        console.log('[Mock] Stopping gateway...');
        gatewayStatus = {
          running: false,
          port: null,
          pid: null,
          uptime: null,
          startTime: null,
        };
        statusListeners.forEach(cb => cb(gatewayStatus));
        return { success: true };
      },
      restart: async () => {
        await (window as any).openclaw.gateway.stop();
        await new Promise(r => setTimeout(r, 500));
        await (window as any).openclaw.gateway.start();
        return { success: true };
      },
      getStatus: async () => {
        if (gatewayStatus.running && gatewayStatus.startTime) {
          gatewayStatus.uptime = Date.now() - gatewayStatus.startTime.getTime();
        }
        return { ...gatewayStatus };
      },
      getLogs: async () => [...mockLogs],
      onLog: (cb: any) => {
        logListeners.push(cb);
        return () => {
          const idx = logListeners.indexOf(cb);
          if (idx > -1) logListeners.splice(idx, 1);
        };
      },
      onStatusChange: (cb: any) => {
        statusListeners.push(cb);
        return () => {
          const idx = statusListeners.indexOf(cb);
          if (idx > -1) statusListeners.splice(idx, 1);
        };
      },
    },
    plugins: {
      list: async () => [...mockPlugins],
      toggle: async (id: string, enabled: boolean) => {
        const plugin = mockPlugins.find(p => p.id === id);
        if (plugin) plugin.enabled = enabled;
        return { success: true };
      },
      install: async () => ({ success: true }),
      uninstall: async () => ({ success: true }),
      update: async () => ({ success: true }),
      checkUpdate: async () => ({ success: true, hasUpdate: false }),
      checkAllUpdates: async () => ({}),
      refresh: async () => ({ success: true }),
    },
    settings: {
      get: async () => ({
        gateway: {
          port: 9787,
          verbose: false,
          autoStart: true,
        },
        providers: {},
        channels: {},
        ui: {
          theme: 'dark' as const,
          language: 'zh-CN',
          minimizeToTray: true,
        },
        update: {
          channel: 'stable' as const,
          autoUpdate: true,
        },
      }),
      update: async () => ({ success: true }),
    },
    update: {
      check: async () => ({ success: true }),
      getStatus: async () => ({
        checking: false,
        available: false,
        downloading: false,
        downloaded: false,
        progress: 0,
        version: null,
        releaseDate: null,
        releaseNotes: null,
        error: null,
      }),
      download: async () => ({ success: true }),
      install: async () => ({ success: true }),
      setChannel: async () => ({ success: true }),
      onUpdateAvailable: () => () => {},
      onProgress: () => () => {},
      onDownloaded: () => () => {},
    },
  };
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('office')

  // 像素风格导航按钮
  const NavButton = ({ 
    label, 
    icon, 
    mode, 
    active 
  }: { 
    label: string, 
    icon: string, 
    mode: ViewMode, 
    active: boolean 
  }) => (
    <button
      onClick={() => setViewMode(mode)}
      style={{
        padding: '8px 16px',
        border: active ? '3px solid #FFD700' : '3px solid #333',
        background: active ? '#1a3a4a' : '#1a1a2e',
        color: '#fff',
        cursor: 'pointer',
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        fontSize: '10px',
        imageRendering: 'pixelated',
        transition: 'all 0.1s',
        boxShadow: active ? '0 0 20px rgba(255, 215, 0, 0.4)' : 'none'
      }}
    >
      <span style={{ marginRight: '8px', fontSize: '16px' }}>{icon}</span>
      {label}
    </button>
  )

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#050510',
      color: '#fff',
      fontFamily: "'Press Start 2P', 'Courier New', monospace"
    }}>
      {/* 像素风格顶部导航 */}
      <nav style={{
        background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f1a 100%)',
        padding: '12px 24px',
        borderBottom: '4px solid #2a2a4a',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginRight: '24px',
          paddingRight: '24px',
          borderRight: '3px solid #2a2a4a'
        }}>
          <span style={{ fontSize: '28px' }}>🎮</span>
          <h1 style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: '#00d4ff',
            textShadow: '0 0 10px rgba(0, 212, 255, 0.5)'
          }}>
            StarCraw
          </h1>
        </div>

        {/* 导航按钮 */}
        <NavButton 
          label="办公室" 
          icon="🏢" 
          mode="office" 
          active={viewMode === 'office'} 
        />
        <NavButton 
          label="员工管理" 
          icon="👥" 
          mode="employees" 
          active={viewMode === 'employees'} 
        />
        <NavButton 
          label="任务队列" 
          icon="📋" 
          mode="tasks" 
          active={viewMode === 'tasks'} 
        />
        <NavButton 
          label="核心模块" 
          icon="🧪" 
          mode="core-modules" 
          active={viewMode === 'core-modules'} 
        />
        <NavButton 
          label="TaskQueue" 
          icon="⚡" 
          mode="task-queue" 
          active={viewMode === 'task-queue'} 
        />
        <NavButton 
          label="设置" 
          icon="⚙️" 
          mode="settings" 
          active={viewMode === 'settings'} 
        />
      </nav>

      {/* 主内容区域 */}
      <main style={{ padding: '20px' }}>
        {viewMode === 'office' && <PixelOffice />}
        
        {viewMode === 'employees' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '24px', color: '#00d4ff', textShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}>
              👥 员工管理
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { name: '张三', role: '产品经理', dept: 'CEO办公室', status: '在线', task: '产品规划' },
                { name: '李四', role: '设计师', dept: '设计部', status: '忙碌', task: '制作产品图' },
                { name: '王五', role: '会计', dept: '财务部', status: '在线', task: '月度报表' },
                { name: '赵六', role: '运营', dept: '市场营销部', status: '离线', task: '无' },
                { name: '钱七', role: 'HR', dept: '人事部', status: '在线', task: '招聘中' },
                { name: '孙八', role: '开发', dept: '技术部', status: '忙碌', task: '写代码' }
              ].map((emp, i) => (
                <div key={i} style={{
                  background: '#1a1a2e',
                  border: '4px solid #333',
                  padding: '16px',
                  borderRadius: '0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}>
                    {emp.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>
                    {emp.role} · {emp.dept}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '4px 8px',
                      background: emp.status === '在线' ? '#14532d' : emp.status === '忙碌' ? '#713f12' : '#374151',
                      color: emp.status === '在线' ? '#86efac' : emp.status === '忙碌' ? '#fde047' : '#9ca3af',
                      border: '2px solid',
                      borderColor: emp.status === '在线' ? '#22c55e' : emp.status === '忙碌' ? '#eab308' : '#6b7280'
                    }}>
                      {emp.status}
                    </span>
                  </div>
                  {emp.task !== '无' && (
                    <div style={{ fontSize: '10px', color: '#aaa', marginTop: '8px' }}>
                      当前: {emp.task}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {viewMode === 'tasks' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '24px', color: '#00d4ff', textShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}>
              📋 任务队列
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { type: '产品图生成', desc: '无线蓝牙耳机主图', dept: '设计部', assign: '李四', progress: 75, priority: 'high', status: 'running' },
                { type: 'Listing文案', desc: '亚马逊产品描述', dept: '市场营销部', assign: '赵六', progress: 0, priority: 'medium', status: 'pending' },
                { type: '销售报告', desc: '3月销售数据分析', dept: '财务部', assign: '王五', progress: 100, priority: 'low', status: 'completed' },
                { type: '视频广告', desc: 'TikTok推广视频', dept: '市场营销部', assign: '赵六', progress: 0, priority: 'urgent', status: 'pending' }
              ].map((task, i) => (
                <div key={i} style={{
                  background: '#1a1a2e',
                  border: '4px solid #333',
                  padding: '16px',
                  borderRadius: '0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}>
                        {task.type}
                      </div>
                      <div style={{ fontSize: '10px', color: '#888' }}>
                        {task.desc}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '4px 8px',
                        background: task.priority === 'urgent' ? '#7f1d1d' : task.priority === 'high' ? '#7c2d12' : task.priority === 'medium' ? '#713f12' : '#14532d',
                        color: task.priority === 'urgent' ? '#fca5a5' : task.priority === 'high' ? '#fdba74' : task.priority === 'medium' ? '#fde047' : '#86efac',
                        border: '2px solid',
                        borderColor: task.priority === 'urgent' ? '#ef4444' : task.priority === 'high' ? '#f97316' : task.priority === 'medium' ? '#eab308' : '#22c55e'
                      }}>
                        {task.priority === 'urgent' ? '紧急' : task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '4px 8px',
                        background: task.status === 'pending' ? '#1e3a8a' : task.status === 'running' ? '#713f12' : '#14532d',
                        color: task.status === 'pending' ? '#93c5fd' : task.status === 'running' ? '#fde047' : '#86efac',
                        border: '2px solid',
                        borderColor: task.status === 'pending' ? '#3b82f6' : task.status === 'running' ? '#eab308' : '#22c55e'
                      }}>
                        {task.status === 'pending' ? '等待中' : task.status === 'running' ? '进行中' : '已完成'}
                      </span>
                    </div>
                  </div>
                  
                  {task.status === 'running' && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        height: '12px',
                        background: '#374151',
                        overflow: 'hidden',
                        border: '2px solid #4b5563'
                      }}>
                        <div style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                          width: `${task.progress}%`,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                        {task.progress}%
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#888' }}>
                    <span>📁 {task.dept}</span>
                    <span>👤 {task.assign}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {viewMode === 'core-modules' && <CoreModulesTest />}
        {viewMode === 'task-queue' && <TaskQueueTest />}
        {viewMode === 'settings' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '24px', color: '#00d4ff', textShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}>
              ⚙️ 设置（包含 OpenClaw 控制）
            </h2>
            
            {/* 设置内的子导航 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setViewMode('dashboard' as any)}
                style={{
                  padding: '8px 16px',
                  border: '3px solid #333',
                  background: '#1a1a2e',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '10px'
                }}
              >
                📊 仪表盘
              </button>
              <button
                onClick={() => setViewMode('plugins' as any)}
                style={{
                  padding: '8px 16px',
                  border: '3px solid #333',
                  background: '#1a1a2e',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '10px'
                }}
              >
                🔌 插件
              </button>
              <button
                onClick={() => setViewMode('logs' as any)}
                style={{
                  padding: '8px 16px',
                  border: '3px solid #333',
                  background: '#1a1a2e',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '10px'
                }}
              >
                📜 日志
              </button>
              <button
                onClick={() => setViewMode('settings' as any)}
                style={{
                  padding: '8px 16px',
                  border: '3px solid #00d4ff',
                  background: '#1a3a4a',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '10px'
                }}
              >
                ⚙️ 系统设置
              </button>
            </div>

            {/* 显示相应的内容 */}
            {viewMode === 'dashboard' && <Dashboard />}
            {viewMode === 'plugins' && <Plugins />}
            {viewMode === 'logs' && <Logs />}
            {viewMode === 'settings' && <Settings />}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
