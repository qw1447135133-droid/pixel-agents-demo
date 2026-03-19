import { useState, useEffect } from 'react';

interface Plugin {
  id: string;
  type: 'skill' | 'extension';
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  source?: 'builtin' | 'user' | 'npm' | 'git' | 'local';
  updateAvailable?: boolean;
  latestVersion?: string;
}

function Plugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'skill' | 'extension'>('all');
  const [loading, setLoading] = useState(true);
  const [installSource, setInstallSource] = useState('');
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    setLoading(true);
    const list = await window.openclaw?.plugins.list();
    setPlugins(list || []);
    setLoading(false);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await window.openclaw?.plugins.toggle(id, enabled);
    setPlugins(plugins.map(p => p.id === id ? { ...p, enabled } : p));
  };

  const handleInstall = async () => {
    if (!installSource.trim()) return;

    setInstalling(true);
    setInstallError(null);

    const result = await window.openclaw?.plugins.install(installSource.trim());

    if (result?.success) {
      setInstallSource('');
      await loadPlugins();
    } else {
      setInstallError(result?.error || '安装失败');
    }

    setInstalling(false);
  };

  const handleUninstall = async (id: string) => {
    if (!confirm(`确定要卸载插件 "${id}" 吗？`)) return;

    const result = await window.openclaw?.plugins.uninstall(id);
    if (result?.success) {
      setPlugins(plugins.filter(p => p.id !== id));
    } else {
      alert(result?.error || '卸载失败');
    }
  };

  const handleUpdate = async (id: string) => {
    setUpdating(id);
    const result = await window.openclaw?.plugins.update(id);
    
    if (result?.success) {
      await loadPlugins();
    } else {
      alert(result?.error || '更新失败');
    }
    
    setUpdating(null);
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    
    const results = await window.openclaw?.plugins.checkAllUpdates();
    
    if (results) {
      setPlugins(plugins.map(p => ({
        ...p,
        updateAvailable: results[p.id]?.hasUpdate,
        latestVersion: results[p.id]?.latestVersion,
      })));
    }
    
    setCheckingUpdates(false);
  };

  const filteredPlugins = plugins.filter(p => {
    if (activeTab === 'all') return true;
    return p.type === activeTab;
  });

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>插件管理</h2>

      {/* 安装区域 */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h3 className="card-title">安装插件</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="npm 包名、Git URL 或本地路径"
            value={installSource}
            onChange={(e) => setInstallSource(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInstall()}
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            onClick={handleInstall}
            disabled={installing || !installSource.trim()}
          >
            {installing ? '安装中...' : '安装'}
          </button>
        </div>
        {installError && (
          <div style={{ color: 'var(--error)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            {installError}
          </div>
        )}
        <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.75rem' }}>
          支持格式: npm 包名 (如 openclaw-skill-weather)、Git URL (如 https://github.com/xxx/plugin.git)、本地路径
        </div>
      </div>

      {/* 操作栏 */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className="btn-secondary" onClick={loadPlugins}>
          刷新列表
        </button>
        <button 
          className="btn-secondary" 
          onClick={handleCheckUpdates}
          disabled={checkingUpdates}
        >
          {checkingUpdates ? '检查中...' : '检查更新'}
        </button>
      </div>

      {/* 标签页 */}
      <div className="tabs">
        <div
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部 ({plugins.length})
        </div>
        <div
          className={`tab ${activeTab === 'skill' ? 'active' : ''}`}
          onClick={() => setActiveTab('skill')}
        >
          Skills ({plugins.filter(p => p.type === 'skill').length})
        </div>
        <div
          className={`tab ${activeTab === 'extension' ? 'active' : ''}`}
          onClick={() => setActiveTab('extension')}
        >
          Extensions ({plugins.filter(p => p.type === 'extension').length})
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          加载中...
        </div>
      ) : (
        <div className="plugin-list">
          {filteredPlugins.map(plugin => (
            <div key={plugin.id} className="plugin-item">
              <div className="plugin-info">
                <div className="plugin-header">
                  <span className="plugin-name">{plugin.name}</span>
                  {plugin.source === 'builtin' && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.125rem 0.5rem',
                      background: 'var(--primary-light)',
                      borderRadius: '4px',
                      color: 'var(--primary)'
                    }}>
                      内置
                    </span>
                  )}
                  {plugin.updateAvailable && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.125rem 0.5rem',
                      background: 'var(--success-light)',
                      borderRadius: '4px',
                      color: 'var(--success)'
                    }}>
                      有更新
                    </span>
                  )}
                </div>
                <div className="plugin-description">{plugin.description}</div>
                <div className="plugin-meta">
                  <span>{plugin.type === 'skill' ? '🎯' : '🔌'} {plugin.type}</span>
                  <span>v{plugin.version}</span>
                  {plugin.updateAvailable && plugin.latestVersion && (
                    <span style={{ color: 'var(--success)' }}>
                      → v{plugin.latestVersion}
                    </span>
                  )}
                  <span>{plugin.id}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {plugin.updateAvailable && plugin.source !== 'builtin' && (
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => handleUpdate(plugin.id)}
                    disabled={updating === plugin.id}
                  >
                    {updating === plugin.id ? '更新中...' : '更新'}
                  </button>
                )}
                {plugin.source !== 'builtin' && (
                  <button
                    className="btn-danger"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => handleUninstall(plugin.id)}
                  >
                    卸载
                  </button>
                )}
                <div
                  className={`toggle ${plugin.enabled ? 'active' : ''}`}
                  onClick={() => handleToggle(plugin.id, !plugin.enabled)}
                  title={plugin.enabled ? '点击禁用' : '点击启用'}
                />
              </div>
            </div>
          ))}
          {filteredPlugins.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              没有找到插件
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Plugins;