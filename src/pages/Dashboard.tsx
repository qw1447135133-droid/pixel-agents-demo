import { useState, useEffect } from 'react';

interface GatewayStatus {
  running: boolean;
  port: number | null;
  pid: number | null;
  uptime: number | null;
}

interface Plugin {
  id: string;
  type: 'skill' | 'extension';
  name: string;
  enabled: boolean;
}

function Dashboard() {
  const [status, setStatus] = useState<GatewayStatus>({
    running: false,
    port: null,
    pid: null,
    uptime: null,
  });
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  useEffect(() => {
    // 获取 Gateway 状态
    window.openclaw?.gateway.getStatus().then(setStatus);

    // 监听状态变化
    const unsubscribe = window.openclaw?.gateway.onStatusChange((newStatus) => {
      setStatus(newStatus as GatewayStatus);
    });

    // 获取插件列表
    window.openclaw?.plugins.list().then(setPlugins);

    return () => {
      unsubscribe?.();
    };
  }, []);

  const formatUptime = (ms: number | null) => {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const skills = plugins.filter(p => p.type === 'skill');
  const extensions = plugins.filter(p => p.type === 'extension');
  const enabledPlugins = plugins.filter(p => p.enabled);

  return (
    <div className="dashboard">
      <h2 style={{ marginBottom: '1.5rem' }}>仪表盘</h2>

      {/* 状态统计 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: status.running ? 'var(--success)' : 'var(--error)' }}>
            {status.running ? '运行中' : '已停止'}
          </div>
          <div className="stat-label">Gateway 状态</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{status.port || '--'}</div>
          <div className="stat-label">监听端口</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{formatUptime(status.uptime)}</div>
          <div className="stat-label">运行时间</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{plugins.length}</div>
          <div className="stat-label">已安装插件</div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">快速操作</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => window.openclaw?.gateway.start()}
            disabled={status.running}
          >
            启动 Gateway
          </button>
          <button
            className="btn-danger"
            onClick={() => window.openclaw?.gateway.stop()}
            disabled={!status.running}
          >
            停止 Gateway
          </button>
          <button
            className="btn-secondary"
            onClick={() => window.openclaw?.gateway.restart()}
            disabled={!status.running}
          >
            重启 Gateway
          </button>
          {status.running && status.port && (
            <button
              className="btn-secondary"
              onClick={() => window.open(`http://127.0.0.1:${status.port}`, '_blank')}
            >
              打开 Web UI
            </button>
          )}
        </div>
      </div>

      {/* 插件概览 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Skills</h3>
            <span style={{ color: 'var(--text-secondary)' }}>{skills.length} 个</span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {skills.slice(0, 5).map(s => (
              <div key={s.id} style={{ padding: '0.5rem 0' }}>
                {s.name}
              </div>
            ))}
            {skills.length > 5 && (
              <div style={{ padding: '0.5rem 0', fontStyle: 'italic' }}>
                还有 {skills.length - 5} 个...
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Extensions</h3>
            <span style={{ color: 'var(--text-secondary)' }}>{extensions.length} 个</span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {extensions.slice(0, 5).map(e => (
              <div key={e.id} style={{ padding: '0.5rem 0' }}>
                {e.name}
              </div>
            ))}
            {extensions.length > 5 && (
              <div style={{ padding: '0.5rem 0', fontStyle: 'italic' }}>
                还有 {extensions.length - 5} 个...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;